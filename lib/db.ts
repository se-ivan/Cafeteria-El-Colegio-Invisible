import { neon } from "@neondatabase/serverless"
import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"

const databaseUrl = process.env.DATABASE_URL

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set")
  }
  const adapter = new PrismaNeon({ connectionString: databaseUrl })
  return new PrismaClient({ adapter })
}

export const prisma =
  typeof window === "undefined"
    ? (globalForPrisma.prisma ?? createPrismaClient())
    : ({} as PrismaClient)

if (typeof window === "undefined" && process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

export const sql: ReturnType<typeof neon> =
  typeof window === "undefined" && databaseUrl
    ? neon(databaseUrl)
    : ((() => {
        throw new Error("sql client is only available on the server")
      }) as unknown as ReturnType<typeof neon>)

export async function ensureUserPermissionsColumn() {
  if (typeof window !== "undefined") return
  await sql(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS permissions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]
  `)
}

// Type definitions for database models
export type Role = "ADMIN" | "CASHIER"
export type SupplyStatus = "AVAILABLE" | "LOW" | "OUT"
export type PaymentMethod = "CASH" | "CARD"

export interface User {
  id: string
  email: string
  password: string
  name: string
  role: Role
  permissions?: string[]
  created_at: Date
  updated_at: Date
}

export interface Category {
  id: string
  name: string
  sort_order: number
}

export interface Product {
  id: string
  name: string
  price: number
  category_id: string
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface Supply {
  id: string
  name: string
  quantity: number
  unit: string
  reorder_point: number
  status: SupplyStatus
  last_alert_sent_at: Date | null
  created_at: Date
  updated_at: Date
}

export interface RecipeItem {
  id: string
  product_id: string
  supply_id: string
  quantity: number
}

export interface Sale {
  id: string
  total: number
  payment_method: PaymentMethod
  user_id: string
  created_at: Date
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface AlertLog {
  id: string
  supply_id: string
  message: string
  sent_at: Date
}

// Helper function to calculate supply status
export function calculateSupplyStatus(quantity: number, reorderPoint: number): SupplyStatus {
  if (quantity <= 0) return "OUT"
  if (quantity <= reorderPoint) return "LOW"
  return "AVAILABLE"
}

// Generate a CUID-like ID
export function generateId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`
}
