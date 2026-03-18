import { sql } from "@/lib/db"
import type { Category, Product, Supply, Sale, SaleItem, RecipeItem } from "@/lib/types"

// Categories
export async function getCategories(): Promise<Category[]> {
  const categories = await sql<Category[]>`
    SELECT * FROM categories ORDER BY display_order ASC
  `
  return categories
}

// Products
export async function getProducts(): Promise<Product[]> {
  const products = await sql<Product[]>`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = true
    ORDER BY p.category_id, p.name
  `
  return products
}

export async function getProductsByCategory(categoryId: number): Promise<Product[]> {
  const products = await sql<Product[]>`
    SELECT * FROM products
    WHERE category_id = ${categoryId} AND is_active = true
    ORDER BY name
  `
  return products
}

export async function getProductById(id: number): Promise<Product | null> {
  const products = await sql<Product[]>`
    SELECT * FROM products WHERE id = ${id}
  `
  return products[0] || null
}

// Supplies (Inventory)
export async function getSupplies(): Promise<Supply[]> {
  const supplies = await sql<Supply[]>`
    SELECT * FROM supplies ORDER BY name ASC
  `
  return supplies
}

export async function getSupplyById(id: number): Promise<Supply | null> {
  const supplies = await sql<Supply[]>`
    SELECT * FROM supplies WHERE id = ${id}
  `
  return supplies[0] || null
}

export async function getLowStockSupplies(): Promise<Supply[]> {
  const supplies = await sql<Supply[]>`
    SELECT * FROM supplies 
    WHERE status IN ('LOW', 'OUT')
    ORDER BY status DESC, name ASC
  `
  return supplies
}

// Recipes
export async function getRecipeByProduct(productId: number): Promise<RecipeItem[]> {
  const items = await sql<(RecipeItem & { supply_name: string; supply_unit: string })[]>`
    SELECT ri.*, s.name as supply_name, s.unit as supply_unit
    FROM recipe_items ri
    JOIN supplies s ON ri.supply_id = s.id
    WHERE ri.product_id = ${productId}
  `
  return items
}

// Sales
export async function getSales(limit = 50): Promise<Sale[]> {
  const sales = await sql<Sale[]>`
    SELECT s.*, u.name as user_name
    FROM sales s
    JOIN users u ON s.user_id = u.id
    ORDER BY s.created_at DESC
    LIMIT ${limit}
  `
  return sales
}

export async function getSaleById(id: number): Promise<Sale | null> {
  const sales = await sql<Sale[]>`
    SELECT s.*, u.name as user_name
    FROM sales s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ${id}
  `
  
  if (sales.length === 0) return null
  
  const items = await sql<SaleItem[]>`
    SELECT * FROM sale_items WHERE sale_id = ${id}
  `
  
  return { ...sales[0], items }
}

export async function getTodaySales(): Promise<{ total: number; count: number }> {
  const result = await sql<{ total: string; count: string }[]>`
    SELECT 
      COALESCE(SUM(total), 0) as total,
      COUNT(*) as count
    FROM sales
    WHERE created_at >= CURRENT_DATE
  `
  return {
    total: parseFloat(result[0]?.total || "0"),
    count: parseInt(result[0]?.count || "0", 10)
  }
}
