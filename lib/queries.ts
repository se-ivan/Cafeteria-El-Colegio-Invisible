import { sql, ensureUserPermissionsColumn } from "@/lib/db"
import { sanitizePermissions } from "@/lib/permissions"
import type {
  Category,
  Product,
  Supply,
  Sale,
  SaleItem,
  RecipeItem,
  Expense,
  TodayExpenses,
  CashSession,
  CashWithdrawal,
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
    CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category)
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

export async function getOpenCashSessionByUser(userId: number): Promise<CashSession | null> {
  await ensureCashSessionTables()

  const rows = await sql(
    `SELECT *
     FROM cash_sessions
     WHERE user_id = $1 AND status = 'OPEN'
     ORDER BY opened_at DESC
     LIMIT 1`,
    [userId]
  ) as (CashSession & {
    opening_amount: string
    closing_amount: string | null
    expected_cash: string | null
    cash_sales_total: string | null
    card_sales_total: string | null
    expenses_total: string | null
    withdrawals_total: string | null
  })[]

  if (rows.length === 0) return null

  const row = rows[0]
  return {
    ...row,
    opening_amount: Number(row.opening_amount || 0),
    closing_amount: row.closing_amount !== null ? Number(row.closing_amount) : null,
    expected_cash: row.expected_cash !== null ? Number(row.expected_cash) : null,
    cash_sales_total: row.cash_sales_total !== null ? Number(row.cash_sales_total) : null,
    card_sales_total: row.card_sales_total !== null ? Number(row.card_sales_total) : null,
    expenses_total: row.expenses_total !== null ? Number(row.expenses_total) : null,
    withdrawals_total: row.withdrawals_total !== null ? Number(row.withdrawals_total) : null,
  }
}

export async function getCashSessionWithdrawals(sessionId: number): Promise<CashWithdrawal[]> {
  await ensureCashSessionTables()

  const rows = await sql(
    `SELECT *
     FROM cash_withdrawals
     WHERE session_id = $1
     ORDER BY created_at DESC`,
    [sessionId]
  ) as (CashWithdrawal & { amount: string | number })[]

  return rows.map((row) => ({
    ...row,
    amount: Number(row.amount || 0),
  }))
}

export async function getOpenCashSessionSummary(sessionId: number): Promise<{
  cashSalesTotal: number
  cardSalesTotal: number
  expensesTotal: number
  withdrawalsTotal: number
  expectedCash: number
} | null> {
  await ensureCashSessionTables()

  const sessionRows = await sql(
    `SELECT opening_amount
     FROM cash_sessions
     WHERE id = $1 AND status = 'OPEN'
     LIMIT 1`,
    [sessionId]
  ) as { opening_amount: string }[]

  if (sessionRows.length === 0) return null

  const openingAmount = Number(sessionRows[0].opening_amount || 0)

  const [sales, expenses, withdrawals] = await Promise.all([
    sql(
      `SELECT
        COALESCE(SUM(CASE WHEN payment_method = 'CASH' THEN total ELSE 0 END), 0) AS cash_total,
        COALESCE(SUM(CASE WHEN payment_method = 'CARD' THEN total ELSE 0 END), 0) AS card_total
       FROM sales
       WHERE cash_session_id = $1`,
      [sessionId]
    ) as { cash_total: string; card_total: string }[],
    sql(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM expenses
       WHERE cash_session_id = $1`,
      [sessionId]
    ) as { total: string }[],
    sql(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM cash_withdrawals
       WHERE session_id = $1`,
      [sessionId]
    ) as { total: string }[],
  ])

  const cashSalesTotal = Number(sales[0]?.cash_total || 0)
  const cardSalesTotal = Number(sales[0]?.card_total || 0)
  const expensesTotal = Number(expenses[0]?.total || 0)
  const withdrawalsTotal = Number(withdrawals[0]?.total || 0)

  return {
    cashSalesTotal,
    cardSalesTotal,
    expensesTotal,
    withdrawalsTotal,
    expectedCash: openingAmount + cashSalesTotal - expensesTotal - withdrawalsTotal,
  }
}

export async function getExpenses(limit = 100): Promise<Expense[]> {
  await ensureExpensesTable()

  const expenses = await sql(
    `SELECT e.*, u.name as user_name
     FROM expenses e
     LEFT JOIN users u ON e.user_id = u.id
     ORDER BY e.created_at DESC
     LIMIT $1`,
    [limit]
  ) as (Expense & { amount: string | number })[]

  return expenses.map((expense) => ({
    ...expense,
    amount: Number(expense.amount || 0),
  }))
}

export async function getTodayExpenses(): Promise<TodayExpenses> {
  await ensureExpensesTable()

  const result = await sql(`
    SELECT
      COALESCE(SUM(amount), 0) as total,
      COUNT(*) as count
    FROM expenses
    WHERE created_at >= CURRENT_DATE
  `) as { total: string; count: string }[]

  return {
    total: parseFloat(result[0]?.total || "0"),
    count: parseInt(result[0]?.count || "0", 10),
  }
}

// Settings
export async function getWorkersForSettings(): Promise<WorkerUser[]> {
  await ensureUserPermissionsColumn()

  const workers = await sql(`
    SELECT id, email, name, role, permissions, created_at
    FROM users
    ORDER BY created_at DESC
  `) as (WorkerUser & { permissions: string[] | null })[]

  return workers.map((worker) => ({
    ...worker,
    permissions: sanitizePermissions(worker.permissions || []),
  }))
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

type DashboardKpis = {
  todaySalesTotal: number
  todaySalesCount: number
  todayExpensesTotal: number
  monthSalesTotal: number
  monthSalesCount: number
  monthExpensesTotal: number
  monthNetTotal: number
  activeSellers: number
  lowStockSupplies: number
}

type DashboardChartPoint = {
  day: string
  sales: number
  expenses: number
}

type DashboardSellerPerformance = {
  userId: number
  name: string
  salesCount: number
  revenue: number
  averageTicket: number
}

type DashboardMember = {
  id: number
  name: string
  email: string
  role: "ADMIN" | "CASHIER"
  created_at: Date
}

export type AdminDashboardData = {
  kpis: DashboardKpis
  salesByDay: DashboardChartPoint[]
  paymentSplitMonth: {
    cash: number
    card: number
  }
  sellerPerformance: DashboardSellerPerformance[]
  members: DashboardMember[]
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  await ensureExpensesTable()

  const [todayStats, todayExpenses, monthStats, monthExpenses, activeSellers, lowStock, salesByDay, expensesByDay, paymentSplit, members, sellerPerformance] =
    await Promise.all([
      sql(
        `SELECT
          COALESCE(SUM(total), 0) AS total,
          COUNT(*) AS count
        FROM sales
        WHERE created_at >= CURRENT_DATE`
      ) as { total: string; count: string }[],
      sql(
        `SELECT COALESCE(SUM(amount), 0) AS total
         FROM expenses
         WHERE created_at >= CURRENT_DATE`
      ) as { total: string }[],
      sql(
        `SELECT
          COALESCE(SUM(total), 0) AS total,
          COUNT(*) AS count
        FROM sales
        WHERE created_at >= date_trunc('month', CURRENT_DATE)`
      ) as { total: string; count: string }[],
      sql(
        `SELECT COALESCE(SUM(amount), 0) AS total
         FROM expenses
         WHERE created_at >= date_trunc('month', CURRENT_DATE)`
      ) as { total: string }[],
      sql(`SELECT COUNT(*) AS count FROM users WHERE role = 'CASHIER'`) as { count: string }[],
      sql(`SELECT COUNT(*) AS count FROM supplies WHERE status IN ('LOW', 'OUT')`) as { count: string }[],
      sql(
        `WITH days AS (
          SELECT generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, INTERVAL '1 day')::date AS day
        )
        SELECT
          to_char(d.day, 'DD Mon') AS day,
          COALESCE(SUM(s.total), 0) AS total
        FROM days d
        LEFT JOIN sales s ON s.created_at::date = d.day
        GROUP BY d.day
        ORDER BY d.day ASC`
      ) as { day: string; total: string }[],
      sql(
        `WITH days AS (
          SELECT generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, INTERVAL '1 day')::date AS day
        )
        SELECT
          to_char(d.day, 'DD Mon') AS day,
          COALESCE(SUM(e.amount), 0) AS total
        FROM days d
        LEFT JOIN expenses e ON e.created_at::date = d.day
        GROUP BY d.day
        ORDER BY d.day ASC`
      ) as { day: string; total: string }[],
      sql(
        `SELECT payment_method, COALESCE(SUM(total), 0) AS total
        FROM sales
        WHERE created_at >= date_trunc('month', CURRENT_DATE)
        GROUP BY payment_method`
      ) as { payment_method: "CASH" | "CARD"; total: string }[],
      sql(
        `SELECT id, name, email, role, created_at
        FROM users
        ORDER BY created_at DESC`
      ) as DashboardMember[],
      sql(
        `SELECT
          u.id AS user_id,
          u.name,
          COUNT(s.id) AS sales_count,
          COALESCE(SUM(s.total), 0) AS revenue,
          COALESCE(AVG(s.total), 0) AS average_ticket
        FROM users u
        LEFT JOIN sales s
          ON s.user_id = u.id
          AND s.created_at >= CURRENT_DATE - INTERVAL '30 days'
        WHERE u.role = 'CASHIER'
        GROUP BY u.id, u.name
        ORDER BY COALESCE(SUM(s.total), 0) DESC, COUNT(s.id) DESC`
      ) as { user_id: number; name: string; sales_count: string; revenue: string; average_ticket: string }[],
    ])

  const split = paymentSplit.reduce(
    (acc, row) => {
      if (row.payment_method === "CASH") acc.cash = parseFloat(row.total || "0")
      if (row.payment_method === "CARD") acc.card = parseFloat(row.total || "0")
      return acc
    },
    { cash: 0, card: 0 }
  )

  const salesByDayMap = new Map(salesByDay.map((row) => [row.day, parseFloat(row.total || "0")]))
  const expensesByDayMap = new Map(expensesByDay.map((row) => [row.day, parseFloat(row.total || "0")]))
  const mergedDailyData = salesByDay.map((row) => ({
    day: row.day,
    sales: salesByDayMap.get(row.day) || 0,
    expenses: expensesByDayMap.get(row.day) || 0,
  }))

  const monthSalesTotal = parseFloat(monthStats[0]?.total || "0")
  const monthExpensesTotal = parseFloat(monthExpenses[0]?.total || "0")

  return {
    kpis: {
      todaySalesTotal: parseFloat(todayStats[0]?.total || "0"),
      todaySalesCount: parseInt(todayStats[0]?.count || "0", 10),
      todayExpensesTotal: parseFloat(todayExpenses[0]?.total || "0"),
      monthSalesTotal,
      monthSalesCount: parseInt(monthStats[0]?.count || "0", 10),
      monthExpensesTotal,
      monthNetTotal: monthSalesTotal - monthExpensesTotal,
      activeSellers: parseInt(activeSellers[0]?.count || "0", 10),
      lowStockSupplies: parseInt(lowStock[0]?.count || "0", 10),
    },
    salesByDay: mergedDailyData,
    paymentSplitMonth: split,
    sellerPerformance: sellerPerformance.map((row) => ({
      userId: row.user_id,
      name: row.name,
      salesCount: parseInt(row.sales_count || "0", 10),
      revenue: parseFloat(row.revenue || "0"),
      averageTicket: parseFloat(row.average_ticket || "0"),
    })),
    members,
  }
}
