"use server"

import { sql } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import type { PaymentMethod, SupplyStatus, CartItem, Supply } from "@/lib/types"
import { sendInventoryAlert } from "@/lib/whatsapp"

// Helper to calculate supply status
function calculateStatus(currentStock: number, minStock: number): SupplyStatus {
  if (currentStock <= 0) return "OUT"
  if (currentStock <= minStock) return "LOW"
  return "OK"
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
    const saleResult = await sql<{ id: number }[]>`
      INSERT INTO sales (user_id, total, payment_method, notes)
      VALUES (${userId}, ${total}, ${paymentMethod}, ${notes || null})
      RETURNING id
    `
    const saleId = saleResult[0].id

    // Insert sale items
    for (const item of items) {
      await sql`
        INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, subtotal)
        VALUES (
          ${saleId},
          ${item.product.id},
          ${item.product.name},
          ${item.quantity},
          ${item.product.price},
          ${item.product.price * item.quantity}
        )
      `

      // Get recipe for this product and deduct from inventory
      const recipeItems = await sql<{ supply_id: number; quantity: number }[]>`
        SELECT supply_id, quantity FROM recipe_items WHERE product_id = ${item.product.id}
      `

      // Deduct supplies based on recipe
      for (const recipe of recipeItems) {
        const deduction = recipe.quantity * item.quantity
        
        // Update supply and recalculate status
        await sql`
          UPDATE supplies
          SET 
            current_stock = GREATEST(0, current_stock - ${deduction}),
            status = CASE
              WHEN current_stock - ${deduction} <= 0 THEN 'OUT'::supply_status
              WHEN current_stock - ${deduction} <= min_stock THEN 'LOW'::supply_status
              ELSE 'OK'::supply_status
            END,
            updated_at = NOW()
          WHERE id = ${recipe.supply_id}
        `
      }
    }

    // Check for low stock alerts
    const lowStockSupplies = await sql<{ id: number; name: string; current_stock: number; status: string; last_alert_sent: Date | null }[]>`
      SELECT id, name, current_stock, status, last_alert_sent
      FROM supplies
      WHERE status IN ('LOW', 'OUT')
      AND (last_alert_sent IS NULL OR last_alert_sent < NOW() - INTERVAL '4 hours')
    `

    // If there are supplies that need alerts, trigger WhatsApp notification
    if (lowStockSupplies.length > 0) {
      // Update last_alert_sent for these supplies
      const supplyIds = lowStockSupplies.map(s => s.id)
      await sql`
        UPDATE supplies
        SET last_alert_sent = NOW()
        WHERE id = ANY(${supplyIds})
      `

      // Log the alert
      for (const supply of lowStockSupplies) {
        const message = `Alerta: ${supply.name} - Stock: ${supply.current_stock} (${supply.status})`
        await sql`
          INSERT INTO alert_logs (supply_id, message)
          VALUES (${supply.id}, ${message})
        `
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

    return { success: true, saleId }
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
    const supply = await sql<{ min_stock: number }[]>`
      SELECT min_stock FROM supplies WHERE id = ${supplyId}
    `
    
    if (supply.length === 0) {
      throw new Error("Insumo no encontrado")
    }

    const status = calculateStatus(newStock, supply[0].min_stock)

    await sql`
      UPDATE supplies
      SET current_stock = ${newStock}, status = ${status}, updated_at = NOW()
      WHERE id = ${supplyId}
    `

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
    const supply = await sql<{ current_stock: number }[]>`
      SELECT current_stock FROM supplies WHERE id = ${supplyId}
    `
    
    if (supply.length === 0) {
      throw new Error("Insumo no encontrado")
    }

    const status = calculateStatus(supply[0].current_stock, newMinStock)

    await sql`
      UPDATE supplies
      SET min_stock = ${newMinStock}, status = ${status}, updated_at = NOW()
      WHERE id = ${supplyId}
    `

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
    await sql`
      INSERT INTO supplies (name, unit, current_stock, min_stock, status)
      VALUES (${data.name}, ${data.unit}, ${data.currentStock}, ${data.minStock}, ${status})
    `

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
    await sql`DELETE FROM supplies WHERE id = ${supplyId}`
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
    await sql`
      UPDATE products
      SET name = ${data.name}, price = ${data.price}, category_id = ${data.categoryId}, is_active = ${data.isActive}, updated_at = NOW()
      WHERE id = ${productId}
    `

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
    await sql`
      INSERT INTO products (name, price, category_id)
      VALUES (${data.name}, ${data.price}, ${data.categoryId})
    `

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
    await sql`DELETE FROM recipe_items WHERE product_id = ${productId}`

    // Insert new recipe items
    for (const item of items) {
      await sql`
        INSERT INTO recipe_items (product_id, supply_id, quantity)
        VALUES (${productId}, ${item.supplyId}, ${item.quantity})
      `
    }

    revalidatePath("/admin/products")
    return { success: true }
  } catch (error) {
    console.error("Error updating recipe:", error)
    throw new Error("Error al actualizar receta")
  }
}
