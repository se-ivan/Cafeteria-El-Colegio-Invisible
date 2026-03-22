import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { sendWhatsAppMessage } from "@/lib/whatsapp"

export const dynamic = "force-dynamic"

type RecipientRow = { phone: string }
type SalesSummaryRow = {
  total_sales: string
  sales_count: string
  cash_total: string
  card_total: string
}
type ExpenseSummaryRow = {
  total_expenses: string
  expenses_count: string
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value)
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const authHeader = request.headers.get("authorization")

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 })
  }

  const [recipients, salesSummary, expenseSummary] = await Promise.all([
    sql(`SELECT phone FROM whatsapp_recipients WHERE is_active = TRUE ORDER BY created_at DESC`) as unknown as Promise<RecipientRow[]>,
    sql(`
      SELECT
        COALESCE(SUM(total), 0) as total_sales,
        COUNT(*) as sales_count,
        COALESCE(SUM(CASE WHEN payment_method = 'CASH' THEN total ELSE 0 END), 0) as cash_total,
        COALESCE(SUM(CASE WHEN payment_method = 'CARD' THEN total ELSE 0 END), 0) as card_total
      FROM sales
      WHERE created_at >= CURRENT_DATE
    `) as unknown as Promise<SalesSummaryRow[]>,
    sql(`
      SELECT
        COALESCE(SUM(amount), 0) as total_expenses,
        COUNT(*) as expenses_count
      FROM expenses
      WHERE created_at >= CURRENT_DATE
    `) as unknown as Promise<ExpenseSummaryRow[]>,
  ])

  if (recipients.length === 0) {
    return NextResponse.json({ ok: false, error: "No hay destinatarios activos", sent: 0 }, { status: 400 })
  }

  const sales = salesSummary[0]
  const expenses = expenseSummary[0]

  const totalSales = Number(sales?.total_sales || 0)
  const salesCount = Number(sales?.sales_count || 0)
  const cashTotal = Number(sales?.cash_total || 0)
  const cardTotal = Number(sales?.card_total || 0)
  const totalExpenses = Number(expenses?.total_expenses || 0)
  const expensesCount = Number(expenses?.expenses_count || 0)
  const net = totalSales - totalExpenses

  const hasMovements = salesCount > 0 || expensesCount > 0
  const dateText = formatDateLabel(new Date())

  const message = hasMovements
    ? [
        "*Resumen Diario Cafeteria*",
        "",
        `Fecha: ${dateText}`,
        `Ventas: ${salesCount} (${formatCurrency(totalSales)})`,
        `- Efectivo: ${formatCurrency(cashTotal)}`,
        `- Tarjeta: ${formatCurrency(cardTotal)}`,
        `Gastos: ${expensesCount} (${formatCurrency(totalExpenses)})`,
        `Neto del día: ${formatCurrency(net)}`,
      ].join("\n")
    : ["*Resumen Diario Cafeteria*", "", `Fecha: ${dateText}`, "Sin movimientos hoy."].join("\n")

  const results = await Promise.all(recipients.map((recipient) => sendWhatsAppMessage(message, recipient.phone)))
  const sent = results.filter((result) => result.success).length

  return NextResponse.json({
    ok: sent > 0,
    sent,
    recipients: recipients.length,
    hasMovements,
    salesCount,
    expensesCount,
  })
}
