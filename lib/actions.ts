"use server"

import { sql } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import type { PaymentMethod, SupplyStatus, CartItem, Supply, RecipeItem } from "@/lib/types"
import { sendInventoryAlert } from "@/lib/whatsapp"
import { hash } from "bcryptjs"
import { getRecipeByProduct as dbGetRecipeByProduct } from "@/lib/queries"

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

// Helper to calculate supply status
function calculateStatus(currentStock: number, minStock: number): SupplyStatus {
  if (currentStock <= 0) return "OUT"
  if (currentStock <= minStock) return "LOW"
  return "OK"
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
    // Create the sale
    const saleResult = await sql(
      `INSERT INTO sales (user_id, total, payment_method, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [userId, total, paymentMethod, notes || null]
    ) as { id: number }[]
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
    }
  } catch (error) {
    console.error("Error processing sale:", error)
    throw new Error("Error al procesar la venta")
  }
}

// Update supply stock
export async function updateSupplyStock(supplyId: number, newStock: number) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("No autorizado")
  }

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
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("No autorizado")
  }

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
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("No autorizado")
  }

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
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("No autorizado")
  }

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
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("No autorizado")
  }

  try {
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
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("No autorizado")
  }

  try {
    await sql(
      `INSERT INTO products (name, price, category_id)
       VALUES ($1, $2, $3)`,
      [data.name, data.price, data.categoryId]
    )

    revalidatePath("/admin/products")
    revalidatePath("/pos")
    return { success: true }
  } catch (error) {
    console.error("Error creating product:", error)
    throw new Error("Error al crear producto")
  }
}

// Update recipe for a product
export async function updateRecipe(productId: number, items: { supplyId: number; quantity: number }[]) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("No autorizado")
  }

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
  role: "ADMIN" | "CASHIER"
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("No autorizado")
  }

  const localPart = data.emailLocalPart.trim().toLowerCase().split("@")[0]
  if (!localPart) {
    throw new Error("El usuario del correo es obligatorio")
  }

  if (data.password.trim().length < 6) {
    throw new Error("La contrasena debe tener al menos 6 caracteres")
  }

  const email = `${localPart}${WORKER_EMAIL_DOMAIN}`

  try {
    const passwordHash = await hash(data.password, 10)

    await sql(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)`,
      [email, passwordHash, data.name.trim(), data.role]
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
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("No autorizado")
  }

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

// Settings - WhatsApp recipients
export async function addAlertRecipient(phone: string) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("No autorizado")
  }

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
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("No autorizado")
  }

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
  role: "ADMIN" | "CASHIER"
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("No autorizado")
  }

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

  try {
    const passwordHash = await hash(password, 10)

    await sql(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)`,
      [email, passwordHash, name, data.role]
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
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("No autorizado")
  }

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
