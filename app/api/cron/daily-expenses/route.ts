import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { sendWhatsAppMessage } from "@/lib/whatsapp"

export const dynamic = "force-dynamic"

type ExpenseRow = {
  concept: string
  category: string
  amount: string
}

type RecipientRow = {
  phone: string
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value)
}

function buildMessage(expenses: ExpenseRow[]) {
  const now = new Date()
  const dateLabel = now.toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const topItems = expenses.slice(0, 8)
  const details = topItems
    .map((item) => {
      const amount = Number(item.amount || 0)
      return `- ${item.concept} [${item.category}] ${formatCurrency(amount)}`
    })
    .join("\n")

  const total = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const extra = expenses.length > topItems.length ? `\n... y ${expenses.length - topItems.length} gasto(s) más.` : ""

  return `*Resumen Diario de Gastos*\n\nFecha: ${dateLabel}\nRegistros: ${expenses.length}\nTotal: ${formatCurrency(total)}\n\n${details}${extra}`
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const authHeader = request.headers.get("authorization")

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 })
  }

  const [expenses, recipients] = await Promise.all([
    sql(
      `SELECT concept, category, amount
       FROM expenses
       WHERE created_at >= CURRENT_DATE
       ORDER BY created_at DESC`
    ) as unknown as Promise<ExpenseRow[]>,
    sql(
      `SELECT phone
       FROM whatsapp_recipients
       WHERE is_active = TRUE
       ORDER BY created_at DESC`
    ) as unknown as Promise<RecipientRow[]>,
  ])

  if (expenses.length === 0) {
    return NextResponse.json({ ok: true, message: "Sin gastos hoy", sent: 0 })
  }

  if (recipients.length === 0) {
    return NextResponse.json({ ok: false, error: "No hay destinatarios activos", sent: 0 }, { status: 400 })
  }

  const message = buildMessage(expenses)
  const results = await Promise.all(recipients.map((recipient) => sendWhatsAppMessage(message, recipient.phone)))
  const sent = results.filter((result) => result.success).length

  return NextResponse.json({
    ok: sent > 0,
    sent,
    recipients: recipients.length,
    expenses: expenses.length,
  })
}
