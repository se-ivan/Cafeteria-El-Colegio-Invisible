import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { hasPermission, PERMISSION_IDS } from "@/lib/permissions"

export const dynamic = "force-dynamic"

type SessionRow = {
  id: number
  user_id: number
  status: "OPEN" | "CLOSED"
  opening_amount: string
  opening_notes: string | null
  opened_at: string
  closing_amount: string | null
  closing_notes: string | null
  closed_at: string | null
  expected_cash: string | null
  cash_sales_total: string | null
  card_sales_total: string | null
  expenses_total: string | null
  withdrawals_total: string | null
  user_name: string | null
}

type WithdrawalRow = {
  id: number
  amount: string
  reason: string
  created_at: string
  user_name: string | null
}

type SaleRow = {
  id: number
  total: string
  payment_method: "CASH" | "CARD"
  created_at: string
  user_name: string | null
}

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ""
  return `"${String(value).replace(/"/g, '""')}"`
}

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const sessionId = Number(searchParams.get("sessionId"))

  if (!Number.isFinite(sessionId) || sessionId <= 0) {
    return NextResponse.json({ error: "sessionId inválido" }, { status: 400 })
  }

  const userId = parseInt(session.user.id, 10)
  const isAdmin = session.user.role === "ADMIN"

  if (!isAdmin && !hasPermission(session.user, PERMISSION_IDS.CASH_SESSION_EXPORT)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  const rows = await sql(
    `SELECT cs.*, u.name AS user_name
     FROM cash_sessions cs
     LEFT JOIN users u ON cs.user_id = u.id
     WHERE cs.id = $1
     LIMIT 1`,
    [sessionId]
  ) as SessionRow[]

  if (rows.length === 0) {
    return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 })
  }

  const cashSession = rows[0]
  if (!isAdmin && cashSession.user_id !== userId) {
    return NextResponse.json({ error: "No autorizado para esta sesión" }, { status: 403 })
  }

  const [withdrawals, sales] = await Promise.all([
    sql(
      `SELECT w.id, w.amount, w.reason, w.created_at, u.name AS user_name
       FROM cash_withdrawals w
       LEFT JOIN users u ON w.user_id = u.id
       WHERE w.session_id = $1
       ORDER BY w.created_at ASC`,
      [sessionId]
    ) as unknown as Promise<WithdrawalRow[]>,
    sql(
      `SELECT s.id, s.total, s.payment_method, s.created_at, u.name AS user_name
       FROM sales s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.cash_session_id = $1
       ORDER BY s.created_at ASC`,
      [sessionId]
    ) as unknown as Promise<SaleRow[]>,
  ])

  const openingAmount = Number(cashSession.opening_amount || 0)
  const cashSalesTotal = Number(cashSession.cash_sales_total || 0)
  const cardSalesTotal = Number(cashSession.card_sales_total || 0)
  const expensesTotal = Number(cashSession.expenses_total || 0)
  const withdrawalsTotal = Number(cashSession.withdrawals_total || 0)
  const expectedCash = Number(cashSession.expected_cash || 0)
  const closingAmount = Number(cashSession.closing_amount || 0)
  const variance = closingAmount - expectedCash

  const csvLines: string[] = []
  csvLines.push(["seccion", "campo", "valor"].map(escapeCsv).join(","))
  csvLines.push(["sesion", "id", cashSession.id].map(escapeCsv).join(","))
  csvLines.push(["sesion", "cajero", cashSession.user_name || ""].map(escapeCsv).join(","))
  csvLines.push(["sesion", "abierta_en", cashSession.opened_at].map(escapeCsv).join(","))
  csvLines.push(["sesion", "cerrada_en", cashSession.closed_at || ""].map(escapeCsv).join(","))
  csvLines.push(["sesion", "apertura", openingAmount.toFixed(2)].map(escapeCsv).join(","))
  csvLines.push(["sesion", "ventas_efectivo", cashSalesTotal.toFixed(2)].map(escapeCsv).join(","))
  csvLines.push(["sesion", "ventas_tarjeta", cardSalesTotal.toFixed(2)].map(escapeCsv).join(","))
  csvLines.push(["sesion", "gastos", expensesTotal.toFixed(2)].map(escapeCsv).join(","))
  csvLines.push(["sesion", "retiros", withdrawalsTotal.toFixed(2)].map(escapeCsv).join(","))
  csvLines.push(["sesion", "esperado", expectedCash.toFixed(2)].map(escapeCsv).join(","))
  csvLines.push(["sesion", "cierre_declarado", closingAmount.toFixed(2)].map(escapeCsv).join(","))
  csvLines.push(["sesion", "diferencia", variance.toFixed(2)].map(escapeCsv).join(","))

  if (cashSession.opening_notes) {
    csvLines.push(["sesion", "notas_apertura", cashSession.opening_notes].map(escapeCsv).join(","))
  }

  if (cashSession.closing_notes) {
    csvLines.push(["sesion", "notas_cierre", cashSession.closing_notes].map(escapeCsv).join(","))
  }

  csvLines.push("")
  csvLines.push(["retiros", "id", "fecha", "usuario", "motivo", "monto"].map(escapeCsv).join(","))
  for (const withdrawal of withdrawals) {
    csvLines.push(
      [
        "retiro",
        withdrawal.id,
        withdrawal.created_at,
        withdrawal.user_name || "",
        withdrawal.reason,
        Number(withdrawal.amount || 0).toFixed(2),
      ]
        .map(escapeCsv)
        .join(",")
    )
  }

  csvLines.push("")
  csvLines.push(["ventas", "id", "fecha", "usuario", "metodo", "monto"].map(escapeCsv).join(","))
  for (const sale of sales) {
    csvLines.push(
      [
        "venta",
        sale.id,
        sale.created_at,
        sale.user_name || "",
        sale.payment_method,
        Number(sale.total || 0).toFixed(2),
      ]
        .map(escapeCsv)
        .join(",")
    )
  }

  return new NextResponse(csvLines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=corte-caja-${cashSession.id}.csv`,
      "Cache-Control": "no-store",
    },
  })
}
