// Database types
export type UserRole = 'ADMIN' | 'CASHIER'
export type PaymentMethod = 'CASH' | 'CARD'
export type SupplyStatus = 'OK' | 'LOW' | 'OUT'

export interface User {
  id: number
  email: string
  password_hash: string
  name: string
  role: UserRole
  created_at: Date
  updated_at: Date
}

export interface Category {
  id: number
  name: string
  display_order: number
  created_at: Date
}

export interface Supply {
  id: number
  name: string
  unit: string
  current_stock: number
  min_stock: number
  status: SupplyStatus
  last_alert_sent: Date | null
  created_at: Date
  updated_at: Date
}

export interface Product {
  id: number
  name: string
  price: number
  category_id: number
  is_active: boolean
  image_url: string | null
  created_at: Date
  updated_at: Date
  category?: Category
}

export interface RecipeItem {
  id: number
  product_id: number
  supply_id: number
  quantity: number
  supply?: Supply
}

export interface Sale {
  id: number
  user_id: number
  total: number
  payment_method: PaymentMethod
  notes: string | null
  created_at: Date
  user?: User
  items?: SaleItem[]
}

export interface SaleItem {
  id: number
  sale_id: number
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface AlertLog {
  id: number
  supply_id: number
  message: string
  sent_at: Date
}

// Cart types for POS
export interface CartItem {
  product: Product
  quantity: number
}

// Session types for NextAuth
export interface SessionUser {
  id: string
  email: string
  name: string
  role: UserRole
}
