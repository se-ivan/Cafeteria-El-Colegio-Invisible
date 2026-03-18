import { sql } from "@/lib/db"
import type {
  Category,
  Product,
  Supply,
  Sale,
  SaleItem,
  RecipeItem,
  WorkerUser,
  WhatsAppRecipient,
} from "@/lib/types"

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

// Categories
export async function getCategories(): Promise<Category[]> {
  const categories = await sql("SELECT * FROM categories ORDER BY display_order ASC") as Category[]
  return categories
}

// Products
export async function getProducts(): Promise<Product[]> {
  const products = await sql(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = true
    ORDER BY p.category_id, p.name
  `) as Product[]
  return products
}

export async function getProductsByCategory(categoryId: number): Promise<Product[]> {
  const products = await sql(
    `SELECT * FROM products
     WHERE category_id = $1 AND is_active = true
     ORDER BY name`,
    [categoryId]
  ) as Product[]
  return products
}

export async function getProductById(id: number): Promise<Product | null> {
  const products = await sql("SELECT * FROM products WHERE id = $1", [id]) as Product[]
  return products[0] || null
}

// Supplies (Inventory)
export async function getSupplies(): Promise<Supply[]> {
  const supplies = await sql("SELECT * FROM supplies ORDER BY name ASC") as Supply[]
  return supplies
}

export async function getSupplyById(id: number): Promise<Supply | null> {
  const supplies = await sql("SELECT * FROM supplies WHERE id = $1", [id]) as Supply[]
  return supplies[0] || null
}

export async function getLowStockSupplies(): Promise<Supply[]> {
  const supplies = await sql(`
    SELECT * FROM supplies 
    WHERE status IN ('LOW', 'OUT')
    ORDER BY status DESC, name ASC
  `) as Supply[]
  return supplies
}

// Recipes
export async function getRecipeByProduct(productId: number): Promise<RecipeItem[]> {
  const items = await sql(
    `SELECT ri.*, s.name as supply_name, s.unit as supply_unit
     FROM recipe_items ri
     JOIN supplies s ON ri.supply_id = s.id
     WHERE ri.product_id = $1`,
    [productId]
  ) as (RecipeItem & { supply_name: string; supply_unit: string })[]
  return items
}

// Sales
export async function getSales(limit = 50): Promise<Sale[]> {
  const sales = await sql(
    `SELECT s.*, u.name as user_name
     FROM sales s
     JOIN users u ON s.user_id = u.id
     ORDER BY s.created_at DESC
     LIMIT $1`,
    [limit]
  ) as Sale[]
  return sales
}

export async function getSaleById(id: number): Promise<Sale | null> {
  const sales = await sql(
    `SELECT s.*, u.name as user_name
     FROM sales s
     JOIN users u ON s.user_id = u.id
     WHERE s.id = $1`,
    [id]
  ) as Sale[]
  
  if (sales.length === 0) return null
  
  const items = await sql("SELECT * FROM sale_items WHERE sale_id = $1", [id]) as SaleItem[]
  
  return { ...sales[0], items }
}

export async function getTodaySales(): Promise<{ total: number; count: number }> {
  const result = await sql(`
    SELECT 
      COALESCE(SUM(total), 0) as total,
      COUNT(*) as count
    FROM sales
    WHERE created_at >= CURRENT_DATE
  `) as { total: string; count: string }[]
  return {
    total: parseFloat(result[0]?.total || "0"),
    count: parseInt(result[0]?.count || "0", 10)
  }
}

export async function getTodaySalesBreakdown(): Promise<{
  cashTotal: number
  cardTotal: number
  tickets: number
}> {
  const result = await sql(`
    SELECT
      COALESCE(SUM(CASE WHEN payment_method = 'CASH' THEN total ELSE 0 END), 0) AS cash_total,
      COALESCE(SUM(CASE WHEN payment_method = 'CARD' THEN total ELSE 0 END), 0) AS card_total,
      COUNT(*) AS tickets
    FROM sales
    WHERE created_at >= CURRENT_DATE
  `) as { cash_total: string; card_total: string; tickets: string }[]

  return {
    cashTotal: parseFloat(result[0]?.cash_total || "0"),
    cardTotal: parseFloat(result[0]?.card_total || "0"),
    tickets: parseInt(result[0]?.tickets || "0", 10),
  }
}

// Settings
export async function getWorkersForSettings(): Promise<WorkerUser[]> {
  const workers = await sql(`
    SELECT id, email, name, role, created_at
    FROM users
    ORDER BY created_at DESC
  `) as WorkerUser[]
  return workers
}

export async function getWhatsAppRecipients(): Promise<WhatsAppRecipient[]> {
  await ensureWhatsAppRecipientsTable()

  const recipients = await sql(`
    SELECT id, phone, is_active, created_at
    FROM whatsapp_recipients
    WHERE is_active = TRUE
    ORDER BY created_at DESC
  `) as WhatsAppRecipient[]

  return recipients
}
