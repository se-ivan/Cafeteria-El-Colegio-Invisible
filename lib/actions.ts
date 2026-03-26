"use server"

import { sql, ensureUserPermissionsColumn } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import type { AppPermission, PaymentMethod, SupplyStatus, CartItem, Supply, RecipeItem, UserRole } from "@/lib/types"
import { sendExpenseAlert, sendInventoryAlert } from "@/lib/whatsapp"
import { hash } from "bcryptjs"
import { getRecipeByProduct as dbGetRecipeByProduct } from "@/lib/queries"
import {
  hasPermission,
  PERMISSION_IDS,
  permissionsForRole,
  sanitizePermissions,
} from "@/lib/permissions"

const WORKER_EMAIL_DOMAIN = "@elcolegioinvisible.com"

async function ensureWhatsAppRecipientsTable() {
  await sql(`
    CREATE TABLE IF NOT EXISTS whatsapp_recipients (
      id SERIAL PRIMARY KEY,
      phone TEXT NOT NULL UNIQUE,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}

async function ensureExpensesTable() {
  await sql(`
    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      concept TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'OPERATIVOS',
      amount DECIMAL(10,2) NOT NULL,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await sql(`
    CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at DESC)
  `)

  await sql(`
    ALTER TABLE expenses
    ADD COLUMN IF NOT EXISTS cash_session_id INTEGER
  `)

  await sql(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'cash_sessions'
      ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_schema = 'public'
          AND table_name = 'expenses'
          AND constraint_name = 'expenses_cash_session_id_fkey'
      ) THEN
        ALTER TABLE expenses
        ADD CONSTRAINT expenses_cash_session_id_fkey
        FOREIGN KEY (cash_session_id) REFERENCES cash_sessions(id) ON DELETE SET NULL;
      END IF;
    END
    $$
  `)
}

async function ensureCashSessionTables() {
  await sql(`
    CREATE TABLE IF NOT EXISTS cash_sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'OPEN',
      opening_amount DECIMAL(10,2) NOT NULL,
      opening_notes TEXT,
      opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      closing_amount DECIMAL(10,2),
      closing_notes TEXT,
      closed_at TIMESTAMPTZ,
      expected_cash DECIMAL(10,2),
      cash_sales_total DECIMAL(10,2),
      card_sales_total DECIMAL(10,2),
      expenses_total DECIMAL(10,2),
      withdrawals_total DECIMAL(10,2)
    )
  `)

  await sql(`
    CREATE TABLE IF NOT EXISTS cash_withdrawals (
      id SERIAL PRIMARY KEY,
      session_id INTEGER NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      amount DECIMAL(10,2) NOT NULL,
      reason TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await sql(`
    CREATE INDEX IF NOT EXISTS idx_cash_sessions_user ON cash_sessions(user_id)
  `)

  await sql(`
    CREATE INDEX IF NOT EXISTS idx_cash_sessions_status ON cash_sessions(status)
  `)

  await sql(`
    CREATE INDEX IF NOT EXISTS idx_cash_withdrawals_session ON cash_withdrawals(session_id)
  `)

  await sql(`
    ALTER TABLE sales
    ADD COLUMN IF NOT EXISTS cash_session_id INTEGER REFERENCES cash_sessions(id) ON DELETE SET NULL
  `)

  await sql(`
    CREATE INDEX IF NOT EXISTS idx_sales_cash_session ON sales(cash_session_id)
  `)

  await ensureExpensesTable()
}

// Helper to calculate supply status
function calculateStatus(currentStock: number, minStock: number): SupplyStatus {
  if (currentStock <= 0) return "OUT"
  if (currentStock <= minStock) return "LOW"
  return "OK"
}

function assertPermission(
  session: Awaited<ReturnType<typeof auth>>,
  permission: AppPermission
) {
  if (!session?.user || !hasPermission(session.user, permission)) {
    throw new Error("No autorizado")
  }
}

// Get recipe items for a product (used by client components)
export async function getRecipeAction(productId: number): Promise<RecipeItem[]> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("No autorizado")
  }
  return dbGetRecipeByProduct(productId)
}

// Process a sale
export async function processSale(
  items: CartItem[],
  paymentMethod: PaymentMethod,
  notes?: string
) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("No autorizado")
  }

  const userId = parseInt(session.user.id, 10)
  const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)

  try {
    await ensureCashSessionTables()

    let openSession = await sql(
      `SELECT id
       FROM cash_sessions
       WHERE user_id = $1 AND status = 'OPEN'
       ORDER BY opened_at DESC
       LIMIT 1`,
      [userId]
    ) as { id: number }[]

    if (openSession.length === 0) {
      // Auto-open an operational cash session so cafeteria sales are not blocked.
      const createdSession = await sql(
        `INSERT INTO cash_sessions (user_id, status, opening_amount, opening_notes)
         VALUES ($1, 'OPEN', 0, $2)
         RETURNING id`,
        [userId, "Apertura automatica por venta desde cafeteria"]
      ) as { id: number }[]

      openSession = createdSession
    }

    const cashSessionId = openSession[0].id

    // Create the sale
    const saleResult = await sql(
      `INSERT INTO sales (user_id, cash_session_id, total, payment_method, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at`,
      [userId, cashSessionId, total, paymentMethod, notes || null]
    ) as { id: number; created_at: Date }[]
    const saleId = saleResult[0].id

    // Insert sale items
    for (const item of items) {
      await sql(
        `INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          saleId,
          item.product.id,
          item.product.name,
          item.quantity,
          item.product.price,
          item.product.price * item.quantity
        ]
      )

      // Get recipe for this product and deduct from inventory
      const recipeItems = await sql(
        "SELECT supply_id, quantity FROM recipe_items WHERE product_id = $1",
        [item.product.id]
      ) as { supply_id: number; quantity: number }[]

      // Deduct supplies based on recipe
      for (const recipe of recipeItems) {
        const deduction = recipe.quantity * item.quantity
        
        // Update supply and recalculate status
        await sql(
          `UPDATE supplies
           SET 
             current_stock = GREATEST(0, current_stock - $1),
             status = CASE
               WHEN current_stock - $1 <= 0 THEN 'OUT'::supply_status
               WHEN current_stock - $1 <= min_stock THEN 'LOW'::supply_status
               ELSE 'OK'::supply_status
             END,
             updated_at = NOW()
           WHERE id = $2`,
          [deduction, recipe.supply_id]
        )
      }
    }

    // Check for low stock alerts
    const lowStockSupplies = await sql(`
      SELECT id, name, current_stock, status, last_alert_sent
      FROM supplies
      WHERE status IN ('LOW', 'OUT')
      AND (last_alert_sent IS NULL OR last_alert_sent < NOW() - INTERVAL '4 hours')
    `) as { id: number; name: string; current_stock: number; status: string; last_alert_sent: Date | null }[]

    // If there are supplies that need alerts, trigger WhatsApp notification
    if (lowStockSupplies.length > 0) {
      // Update last_alert_sent for these supplies
      const supplyIds = lowStockSupplies.map(s => s.id)
      await sql(
        `UPDATE supplies
         SET last_alert_sent = NOW()
         WHERE id = ANY($1)`,
        [supplyIds]
      )

      // Log the alert
      for (const supply of lowStockSupplies) {
        const message = `Alerta: ${supply.name} - Stock: ${supply.current_stock} (${supply.status})`
        await sql(
          `INSERT INTO alert_logs (supply_id, message)
           VALUES ($1, $2)`,
          [supply.id, message]
        )
      }

      // Send WhatsApp alert
      const suppliesForAlert: Supply[] = lowStockSupplies.map(s => ({
        id: s.id,
        name: s.name,
        current_stock: s.current_stock,
        status: s.status as SupplyStatus,
        unit: "",
        min_stock: 0,
        last_alert_sent: s.last_alert_sent,
        created_at: new Date(),
        updated_at: new Date()
      }))
      await sendInventoryAlert(suppliesForAlert)
    }

    revalidatePath("/pos")
    revalidatePath("/admin/inventory")
    revalidatePath("/admin/sales")

    return {
      success: true,
      saleId,
      total,
      lowStockCount: lowStockSupplies.length,
      createdAt: saleResult[0].created_at,
    }
  } catch (error) {
    console.error("Error processing sale:", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Error al procesar la venta")
  }
}

// Update supply stock
export async function updateSupplyStock(supplyId: number, newStock: number) {
  const session = await auth()
  assertPermission(session, PERMISSION_IDS.INVENTORY_MANAGE)

  try {
    const supply = await sql("SELECT min_stock FROM supplies WHERE id = $1", [supplyId]) as { min_stock: number }[]
    
    if (supply.length === 0) {
      throw new Error("Insumo no encontrado")
    }

    const status = calculateStatus(newStock, supply[0].min_stock)

    await sql(
      `UPDATE supplies
       SET current_stock = $1, status = $2, updated_at = NOW()
       WHERE id = $3`,
      [newStock, status, supplyId]
    )

    revalidatePath("/admin/inventory")
    return { success: true }
  } catch (error) {
    console.error("Error updating supply:", error)
    throw new Error("Error al actualizar inventario")
  }
}

// Update supply min stock (threshold)
export async function updateSupplyMinStock(supplyId: number, newMinStock: number) {
  const session = await auth()
  assertPermission(session, PERMISSION_IDS.INVENTORY_MANAGE)

  try {
    const supply = await sql("SELECT current_stock FROM supplies WHERE id = $1", [supplyId]) as { current_stock: number }[]
    
    if (supply.length === 0) {
      throw new Error("Insumo no encontrado")
    }

    const status = calculateStatus(supply[0].current_stock, newMinStock)

    await sql(
      `UPDATE supplies
       SET min_stock = $1, status = $2, updated_at = NOW()
       WHERE id = $3`,
      [newMinStock, status, supplyId]
    )

    revalidatePath("/admin/inventory")
    return { success: true }
  } catch (error) {
    console.error("Error updating supply threshold:", error)
    throw new Error("Error al actualizar umbral")
  }
}

// Create new supply
export async function createSupply(data: {
  name: string
  category?: string
  unit: string
  currentStock: number
  minStock: number
}) {
  const session = await auth()
  assertPermission(session, PERMISSION_IDS.INVENTORY_MANAGE)

  const status = calculateStatus(data.currentStock, data.minStock)

  try {
    await sql(
      `INSERT INTO supplies (name, category, unit, current_stock, min_stock, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [data.name, data.category || "Otros", data.unit, data.currentStock, data.minStock, status]
    )

    revalidatePath("/admin/inventory")
    return { success: true }
  } catch (error) {
    console.error("Error creating supply:", error)
    throw new Error("Error al crear insumo")
  }
}

// Delete supply
export async function deleteSupply(supplyId: number) {
  const session = await auth()
  assertPermission(session, PERMISSION_IDS.INVENTORY_MANAGE)

  try {
    await sql("DELETE FROM supplies WHERE id = $1", [supplyId])
    revalidatePath("/admin/inventory")
    return { success: true }
  } catch (error) {
    console.error("Error deleting supply:", error)
    throw new Error("Error al eliminar insumo")
  }
}

// Update product
export async function updateProduct(productId: number, data: {
  name: string
  price: number
  categoryId: number
  isActive: boolean
}) {
  const session = await auth()
  assertPermission(session, PERMISSION_IDS.PRODUCTS_MANAGE)

  try {
    // Ensure optional columns exist
    await sql(`ALTER TABLE products ADD COLUMN IF NOT EXISTS icon TEXT`)
    await sql(`ALTER TABLE products ADD COLUMN IF NOT EXISTS color TEXT`)

    await sql(
      `UPDATE products
       SET name = $1, price = $2, category_id = $3, is_active = $4, updated_at = NOW()
       WHERE id = $5`,
      [data.name, data.price, data.categoryId, data.isActive, productId]
    )

    revalidatePath("/admin/products")
    revalidatePath("/pos")
    return { success: true }
  } catch (error) {
    console.error("Error updating product:", error)
    throw new Error("Error al actualizar producto")
  }
}

// Create product
export async function createProduct(data: {
  name: string
  price: number
  categoryId: number
}) {
  const session = await auth()
  assertPermission(session, PERMISSION_IDS.PRODUCTS_MANAGE)

  try {
    // Ensure optional columns exist
    await sql(`ALTER TABLE products ADD COLUMN IF NOT EXISTS icon TEXT`)
    await sql(`ALTER TABLE products ADD COLUMN IF NOT EXISTS color TEXT`)

    await sql(
      `INSERT INTO products (name, price, category_id, icon, color)
       VALUES ($1, $2, $3, $4, $5)`,
      [data.name, data.price, data.categoryId, (data as any).icon || null, (data as any).color || null]
    )

    revalidatePath("/admin/products")
    revalidatePath("/pos")
    return { success: true }
  } catch (error) {
    console.error("Error creating product:", error)
    throw new Error("Error al crear producto")
  }
}

// Create category
export async function createCategory(data: { name: string; displayOrder?: number }) {
  const session = await auth()
  assertPermission(session, PERMISSION_IDS.PRODUCTS_MANAGE)

  const name = data.name.trim()
  if (!name) throw new Error("El nombre de la categoria es obligatorio")

  try {
    await sql(
      `INSERT INTO categories (name, display_order)
       VALUES ($1, $2)
       ON CONFLICT (name) DO NOTHING`,
      [name, data.displayOrder ?? 0]
    )

    revalidatePath("/admin/products")
    revalidatePath("/pos")
    return { success: true }
  } catch (error) {
    console.error("Error creating category:", error)
    throw new Error("No se pudo crear la categoria")
  }
}

export async function updateCategory(categoryId: number, data: { name: string; displayOrder?: number }) {
  const session = await auth()
  assertPermission(session, PERMISSION_IDS.PRODUCTS_MANAGE)

  const name = data.name.trim()
  if (!name) throw new Error("El nombre de la categoria es obligatorio")

  try {
    await sql(
      `UPDATE categories
       SET name = $1, display_order = $2
       WHERE id = $3`,
      [name, data.displayOrder ?? 0, categoryId]
    )

    revalidatePath("/admin/products")
    revalidatePath("/pos")
    return { success: true }
  } catch (error) {
    console.error("Error updating category:", error)
    throw new Error("No se pudo actualizar la categoria")
  }
}

export async function deleteCategory(categoryId: number) {
  const session = await auth()
  assertPermission(session, PERMISSION_IDS.PRODUCTS_MANAGE)

  try {
    // Unlink products from this category
    await sql(`UPDATE products SET category_id = NULL WHERE category_id = $1`, [categoryId])
    // Delete category
    await sql(`DELETE FROM categories WHERE id = $1`, [categoryId])

    revalidatePath("/admin/products")
    revalidatePath("/pos")
    return { success: true }
  } catch (error) {
    console.error("Error deleting category:", error)
    throw new Error("No se pudo eliminar la categoria")
  }
}

// Update recipe for a product
export async function updateRecipe(productId: number, items: { supplyId: number; quantity: number }[]) {
  const session = await auth()
  assertPermission(session, PERMISSION_IDS.PRODUCTS_MANAGE)

  try {
    // Delete existing recipe items
    await sql("DELETE FROM recipe_items WHERE product_id = $1", [productId])

    // Insert new recipe items
    for (const item of items) {
      await sql(
        `INSERT INTO recipe_items (product_id, supply_id, quantity)
         VALUES ($1, $2, $3)`,
        [productId, item.supplyId, item.quantity]
      )
    }

    revalidatePath("/admin/products")
    return { success: true }
  } catch (error) {
    console.error("Error updating recipe:", error)
    throw new Error("Error al actualizar receta")
  }
}

// Settings - Workers
export async function createWorker(data: {
  name: string
  emailLocalPart: string
  password: string
  role: UserRole
  permissions: AppPermission[]
}) {
  const session = await auth()
  assertPermission(session, PERMISSION_IDS.SETTINGS_MANAGE)

  const localPart = data.emailLocalPart.trim().toLowerCase().split("@")[0]
  if (!localPart) {
    throw new Error("El usuario del correo es obligatorio")
  }

  if (data.password.trim().length < 6) {
    throw new Error("La contrasena debe tener al menos 6 caracteres")
  }

  await ensureUserPermissionsColumn()

  const email = `${localPart}${WORKER_EMAIL_DOMAIN}`
  const safePermissions = permissionsForRole(data.role, sanitizePermissions(data.permissions))

  try {
    const passwordHash = await hash(data.password, 10)

    await sql(
      `INSERT INTO users (email, password_hash, name, role, permissions)
       VALUES ($1, $2, $3, $4, $5)`,
      [email, passwordHash, data.name.trim(), data.role, safePermissions]
    )

    revalidatePath("/admin/settings")
    return { success: true }
  } catch (error) {
    console.error("Error creating worker:", error)
    throw new Error("No se pudo crear el trabajador. Verifica si el correo ya existe")
  }
}

export async function removeWorker(workerId: number) {
  const session = await auth()
  assertPermission(session, PERMISSION_IDS.SETTINGS_MANAGE)

  const currentUserId = parseInt(session.user.id, 10)
  if (workerId === currentUserId) {
    throw new Error("No puedes eliminar tu propio usuario")
  }

  try {
    await sql("DELETE FROM users WHERE id = $1", [workerId])
    revalidatePath("/admin/settings")
    return { success: true }
  } catch (error) {
    console.error("Error removing worker:", error)
    throw new Error("No se pudo eliminar el trabajador")
  }
}

export async function updateWorkerAccess(
  workerId: number,
  data: { role: UserRole; permissions: AppPermission[] }
) {
  const session = await auth()
  assertPermission(session, PERMISSION_IDS.SETTINGS_MANAGE)

  const currentUserId = parseInt(session!.user.id, 10)
  if (workerId === currentUserId) {
    throw new Error("No puedes modificar tu propio acceso")
  }

  if (data.role !== "ADMIN" && data.role !== "CASHIER") {
    throw new Error("Rol invalido")
  }

  await ensureUserPermissionsColumn()
  const safePermissions = permissionsForRole(data.role, sanitizePermissions(data.permissions))

  try {
    await sql(
      `UPDATE users
       SET role = $1, permissions = $2, updated_at = NOW()
       WHERE id = $3`,
      [data.role, safePermissions, workerId]
    )

    revalidatePath("/admin/settings")
    revalidatePath("/admin")
    return { success: true }
  } catch (error) {
    console.error("Error updating worker access:", error)
    throw new Error("No se pudo actualizar el acceso del trabajador")
  }
}

// Settings - WhatsApp recipients
export async function addAlertRecipient(phone: string) {
  const session = await auth()
  assertPermission(session, PERMISSION_IDS.SETTINGS_MANAGE)

  const normalizedPhone = phone.replace(/\s+/g, "")
  if (!/^\+\d{8,15}$/.test(normalizedPhone)) {
    throw new Error("Formato invalido. Usa formato internacional, por ejemplo +521234567890")
  }

  await ensureWhatsAppRecipientsTable()

  try {
    await sql(
      `INSERT INTO whatsapp_recipients (phone, is_active)
       VALUES ($1, TRUE)
       ON CONFLICT (phone)
       DO UPDATE SET is_active = TRUE`,
      [normalizedPhone]
    )

    revalidatePath("/admin/settings")
    return { success: true }
  } catch (error) {
    console.error("Error adding recipient:", error)
    throw new Error("No se pudo guardar el numero")
  }
}

export async function removeAlertRecipient(recipientId: number) {
  const session = await auth()
  assertPermission(session, PERMISSION_IDS.SETTINGS_MANAGE)

  await ensureWhatsAppRecipientsTable()

  try {
    await sql("DELETE FROM whatsapp_recipients WHERE id = $1", [recipientId])
    revalidatePath("/admin/settings")
    return { success: true }
  } catch (error) {
    console.error("Error removing recipient:", error)
    throw new Error("No se pudo eliminar el numero")
  }
}

export async function createAdminMember(data: {
  name: string
  email: string
  password: string
  role: UserRole
  permissions?: AppPermission[]
}) {
  const session = await auth()
  assertPermission(session, PERMISSION_IDS.SETTINGS_MANAGE)

  const name = data.name.trim()
  const email = data.email.trim().toLowerCase()
  const password = data.password.trim()

  if (!name) {
    throw new Error("El nombre es obligatorio")
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error("Correo invalido")
  }

  if (password.length < 6) {
    throw new Error("La contrasena debe tener al menos 6 caracteres")
  }

  if (data.role !== "ADMIN" && data.role !== "CASHIER") {
    throw new Error("Rol invalido")
  }

  await ensureUserPermissionsColumn()
  const safePermissions = permissionsForRole(data.role, sanitizePermissions(data.permissions || []))

  try {
    const passwordHash = await hash(password, 10)

    await sql(
      `INSERT INTO users (email, password_hash, name, role, permissions)
       VALUES ($1, $2, $3, $4, $5)`,
      [email, passwordHash, name, data.role, safePermissions]
    )

    revalidatePath("/admin")
    revalidatePath("/admin/settings")
    return { success: true }
  } catch (error) {
    console.error("Error creating member:", error)
    throw new Error("No se pudo crear el miembro. Verifica que el correo no exista")
  }
}

export async function resetMemberPassword(userId: number, newPassword: string) {
  const session = await auth()
  assertPermission(session, PERMISSION_IDS.SETTINGS_MANAGE)

  const safePassword = newPassword.trim()
  if (safePassword.length < 6) {
    throw new Error("La contrasena debe tener al menos 6 caracteres")
  }

  try {
    const passwordHash = await hash(safePassword, 10)

    await sql(
      `UPDATE users
       SET password_hash = $1, updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, userId]
    )

    revalidatePath("/admin")
    revalidatePath("/admin/settings")
    return { success: true }
  } catch (error) {
    console.error("Error resetting member password:", error)
    throw new Error("No se pudo restablecer la contrasena")
  }
}

export async function createExpense(data: {
  concept: string
  category: string
  amount: number
  notes?: string
}) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("No autorizado")
  }

  const concept = data.concept.trim()
  const category = data.category.trim() || "OPERATIVOS"
  const amount = Number(data.amount)
  const notes = data.notes?.trim() || null

  if (!concept) {
    throw new Error("El concepto es obligatorio")
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("El monto debe ser mayor a 0")
  }

  await ensureExpensesTable()
  await ensureCashSessionTables()

  const userId = parseInt(session.user.id, 10)

  try {
    const openSession = await sql(
      `SELECT id
       FROM cash_sessions
       WHERE user_id = $1 AND status = 'OPEN'
       ORDER BY opened_at DESC
       LIMIT 1`,
      [userId]
    ) as { id: number }[]

    const cashSessionId = openSession[0]?.id || null

    const rows = await sql(
      `INSERT INTO expenses (user_id, cash_session_id, concept, category, amount, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [userId, cashSessionId, concept, category, amount, notes]
    ) as { id: number }[]

    await sendExpenseAlert({
      concept,
      category,
      amount,
      notes,
      createdBy: session.user.name || session.user.email || "Usuario",
    })

    revalidatePath("/admin")
    revalidatePath("/admin/expenses")

    return { success: true, id: rows[0]?.id }
  } catch (error) {
    console.error("Error creating expense:", error)
    throw new Error("No se pudo registrar el gasto")
  }
}

export async function openCashSession(data: { openingAmount: number; notes?: string }) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("No autorizado")
  }

  const userId = parseInt(session.user.id, 10)
  const openingAmount = Number(data.openingAmount)
  const notes = data.notes?.trim() || null

  if (!Number.isFinite(openingAmount) || openingAmount < 0) {
    throw new Error("El monto de apertura debe ser mayor o igual a 0")
  }

  await ensureCashSessionTables()

  const existingOpen = await sql(
    `SELECT id FROM cash_sessions WHERE user_id = $1 AND status = 'OPEN' LIMIT 1`,
    [userId]
  ) as { id: number }[]

  if (existingOpen.length > 0) {
    throw new Error("Ya tienes una sesión de caja abierta")
  }

  const rows = await sql(
    `INSERT INTO cash_sessions (user_id, status, opening_amount, opening_notes)
     VALUES ($1, 'OPEN', $2, $3)
     RETURNING id`,
    [userId, openingAmount, notes]
  ) as { id: number }[]

  revalidatePath("/pos")
  return { success: true, sessionId: rows[0]?.id }
}

export async function registerCashWithdrawal(data: { amount: number; reason: string }) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("No autorizado")
  }

  const userId = parseInt(session.user.id, 10)
  const amount = Number(data.amount)
  const reason = data.reason.trim()

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("El retiro debe ser mayor a 0")
  }

  if (!reason) {
    throw new Error("Debes indicar el motivo del retiro")
  }

  await ensureCashSessionTables()

  const openSession = await sql(
    `SELECT id
     FROM cash_sessions
     WHERE user_id = $1 AND status = 'OPEN'
     ORDER BY opened_at DESC
     LIMIT 1`,
    [userId]
  ) as { id: number }[]

  if (openSession.length === 0) {
    throw new Error("No hay sesión de caja abierta para registrar retiros")
  }

  await sql(
    `INSERT INTO cash_withdrawals (session_id, user_id, amount, reason)
     VALUES ($1, $2, $3, $4)`,
    [openSession[0].id, userId, amount, reason]
  )

  revalidatePath("/pos")
  return { success: true }
}

export async function closeCashSession(data: { closingAmount: number; notes?: string }) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("No autorizado")
  }

  const userId = parseInt(session.user.id, 10)
  const closingAmount = Number(data.closingAmount)
  const notes = data.notes?.trim() || null

  if (!Number.isFinite(closingAmount) || closingAmount < 0) {
    throw new Error("El cierre debe ser mayor o igual a 0")
  }

  await ensureCashSessionTables()

  const openRows = await sql(
    `SELECT id, opening_amount, opened_at
     FROM cash_sessions
     WHERE user_id = $1 AND status = 'OPEN'
     ORDER BY opened_at DESC
     LIMIT 1`,
    [userId]
  ) as { id: number; opening_amount: string; opened_at: Date }[]

  if (openRows.length === 0) {
    throw new Error("No hay sesión de caja abierta")
  }

  const openSession = openRows[0]

  const [sales, expenses, withdrawals] = await Promise.all([
    sql(
      `SELECT
        COALESCE(SUM(CASE WHEN payment_method = 'CASH' THEN total ELSE 0 END), 0) AS cash_total,
        COALESCE(SUM(CASE WHEN payment_method = 'CARD' THEN total ELSE 0 END), 0) AS card_total
       FROM sales
       WHERE cash_session_id = $1`,
      [openSession.id]
    ) as { cash_total: string; card_total: string }[],
    sql(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM expenses
       WHERE cash_session_id = $1`,
      [openSession.id]
    ) as { total: string }[],
    sql(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM cash_withdrawals
       WHERE session_id = $1`,
      [openSession.id]
    ) as { total: string }[],
  ])

  const openingAmount = Number(openSession.opening_amount || 0)
  const cashSalesTotal = Number(sales[0]?.cash_total || 0)
  const cardSalesTotal = Number(sales[0]?.card_total || 0)
  const expensesTotal = Number(expenses[0]?.total || 0)
  const withdrawalsTotal = Number(withdrawals[0]?.total || 0)
  const expectedCash = openingAmount + cashSalesTotal - expensesTotal - withdrawalsTotal

  await sql(
    `UPDATE cash_sessions
     SET
       status = 'CLOSED',
       closing_amount = $1,
       closing_notes = $2,
       closed_at = NOW(),
       expected_cash = $3,
       cash_sales_total = $4,
       card_sales_total = $5,
       expenses_total = $6,
       withdrawals_total = $7
     WHERE id = $8`,
    [
      closingAmount,
      notes,
      expectedCash,
      cashSalesTotal,
      cardSalesTotal,
      expensesTotal,
      withdrawalsTotal,
      openSession.id,
    ]
  )

  const variance = closingAmount - expectedCash

  const reportMessage = [
    "*Corte de Caja Cerrado*",
    `Sesión #${openSession.id}`,
    `Apertura: $${openingAmount.toFixed(2)}`,
    `Ventas efectivo: $${cashSalesTotal.toFixed(2)}`,
    `Ventas tarjeta: $${cardSalesTotal.toFixed(2)}`,
    `Gastos: $${expensesTotal.toFixed(2)}`,
    `Retiros: $${withdrawalsTotal.toFixed(2)}`,
    `Esperado: $${expectedCash.toFixed(2)}`,
    `Cierre declarado: $${closingAmount.toFixed(2)}`,
    `Diferencia: $${variance.toFixed(2)}`,
  ].join("\n")

  try {
    const { sendWhatsAppMessage } = await import("@/lib/whatsapp")
    const recipients = await sql(
      `SELECT phone
       FROM whatsapp_recipients
       WHERE is_active = TRUE
       ORDER BY created_at DESC`
    ) as { phone: string }[]

    await Promise.all(recipients.map((recipient) => sendWhatsAppMessage(reportMessage, recipient.phone)))
  } catch (error) {
    console.error("Cash close WhatsApp notification failed:", error)
  }

  revalidatePath("/pos")
  revalidatePath("/admin/sales")
  revalidatePath("/admin/expenses")

  return {
    success: true,
    sessionId: openSession.id,
    expectedCash,
    closingAmount,
    variance,
    exportUrl: `/api/cash-session/export?sessionId=${openSession.id}`,
  }
}
