// Database types
export type UserRole = 'ADMIN' | 'CASHIER'
export type PaymentMethod = 'CASH' | 'CARD'
export type SupplyStatus = 'OK' | 'LOW' | 'OUT'
export type AppPermission =
  | 'ADMIN_DASHBOARD'
  | 'INVENTORY_MANAGE'
  | 'PRODUCTS_MANAGE'
  | 'SALES_VIEW'
  | 'EXPENSES_MANAGE'
  | 'REPORTS_VIEW'
  | 'SETTINGS_MANAGE'
  | 'POS_ACCESS'
  | 'CASH_SESSION_EXPORT'

export interface User {
  id: number
  email: string
  password_hash: string
  name: string
  role: UserRole
  permissions?: AppPermission[]
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
  category?: string | null
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

export interface Expense {
  id: number
  user_id: number | null
  concept: string
  category: string
  amount: number
  notes: string | null
  created_at: Date
  user_name?: string | null
}

export interface TodayExpenses {
  total: number
  count: number
}

export type CashSessionStatus = "OPEN" | "CLOSED"

export interface CashSession {
  id: number
  user_id: number
  status: CashSessionStatus
  opening_amount: number
  opening_notes: string | null
  opened_at: Date
  closing_amount: number | null
  closing_notes: string | null
  closed_at: Date | null
  expected_cash: number | null
  cash_sales_total: number | null
  card_sales_total: number | null
  expenses_total: number | null
  withdrawals_total: number | null
}

export interface CashWithdrawal {
  id: number
  session_id: number
  user_id: number | null
  amount: number
  reason: string
  created_at: Date
}

// Cart types for cafeteria checkout
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
  permissions: AppPermission[]
}

export interface WorkerUser {
  id: number
  email: string
  name: string
  role: UserRole
  permissions: AppPermission[]
  created_at: Date
}

export interface WhatsAppRecipient {
  id: number
  phone: string
  is_active: boolean
  created_at: Date
}
