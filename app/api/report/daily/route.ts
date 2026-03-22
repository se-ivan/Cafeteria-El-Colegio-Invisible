import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { hasPermission, PERMISSION_IDS } from "@/lib/permissions"
import ExcelJS from "exceljs"

export const dynamic = "force-dynamic"

type SaleRow = {
  id: number
  created_at: string
  payment_method: "CASH" | "CARD"
  total: string
  notes: string | null
  user_name: string | null
}

type ExpenseRow = {
  id: number
  created_at: string
  concept: string
  category: string
  amount: string
  notes: string | null
  user_name: string | null
}

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ""
  const text = String(value).replace(/"/g, '""')
  return `\"${text}\"`
}

function normalizeDate(dateParam: string | null): string {
  if (!dateParam) {
    const now = new Date()
    return now.toISOString().slice(0, 10)
  }
  return dateParam
}

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
	  if (!hasPermission(session.user, PERMISSION_IDS.REPORTS_VIEW)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const date = normalizeDate(searchParams.get("date"))
  const format = searchParams.get("format") || "csv"

  const [sales, expenses] = await Promise.all([
    sql(
      `SELECT s.id, s.created_at, s.payment_method,  s.total, s.notes, u.name AS user_name
       FROM sales s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.created_at::date = $1::date
       ORDER BY s.created_at ASC`,
      [date]
    ) as unknown as Promise<SaleRow[]>,
    sql(
      `SELECT e.id, e.created_at, e.concept, e.category, e.amount, e.notes, u.name AS user_name
       FROM expenses e
       LEFT JOIN users u ON e.user_id = u.id
       WHERE e.created_at::date = $1::date
       ORDER BY e.created_at ASC`,
      [date]
    ) as unknown as Promise<ExpenseRow[]>,
  ])

  const salesTotal = sales.reduce((sum, item) => sum + Number(item.total || 0), 0)
  const expensesTotal = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const neto = salesTotal - expensesTotal

  if (format === "xlsx") {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = "El Colegio Invisible"
    workbook.created = new Date()

    const sheet = workbook.addWorksheet("Reporte Diario")
	  sheet.columns = [
      { header: "TIPO", key: "tipo", width: 15 },
      { header: "ID", key: "id", width: 10 },
      { header: "FECHA", key: "fecha", width: 22 },
      { header: "USUARIO", key: "usuario", width: 20 },
      { header: "METODO/CATEGORIA", key: "metodo", width: 25 },
      { header: "CONCEPTO", key: "concepto", width: 30 },
      { header: "MONTO", key: "monto", width: 15, style: { numFmt: "\"$\"#,##0.00" } },
      { header: "NOTAS", key: "notas", width: 30 }
    ]

    const headerRow = sheet.getRow(1)
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2563EB" }
      }
      cell.alignment = { horizontal: "center" }
    })

    for (const sale of sales) {
      sheet.addRow({
        tipo: "VENTA",
        id: sale.id,
        fecha: new Date(sale.created_at).toLocaleString(),
        usuario: sale.user_name || "",
        metodo: sale.payment_method,
        concepto: `Ticket ${sale.id}`,
        monto: Number(sale.total || 0),
        notas: sale.notes || ""
      })
    }

    for (const expense of expenses) {
      sheet.addRow({
        tipo: "GASTO",
        id: expense.id,
        fecha: new Date(expense.created_at).toLocaleString(),
        usuario: expense.user_name || "",
        metodo: expense.category,
        concepto: expense.concept,
        monto: Number(expense.amount || 0),
        notas: expense.notes || ""
      })
    }

    sheet.addRow({})

    const rowVentas = sheet.addRow({ tipo: "RESUMEN", metodo: "Ventas", monto: salesTotal })
    rowVentas.font = { bold: true }
    
    const rowGastos = sheet.addRow({ tipo: "RESUMEN", metodo: "Gastos", monto: expensesTotal })
    rowGastos.font = { bold: true }
    
    const rowNeto = sheet.addRow({ tipo: "RESUMEN", metodo: "Neto", monto: neto })
    rowNeto.font = { bold: true }

    const buffer = await workbook.xlsx.writeBuffer()


	return new NextResponse(buffer as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="cafeteria-reporte-${date}.xlsx"`,
        "Cache-Control": "no-store",
      },
    })
  }

  const csvLines: string[] = []
  csvLines.push(["tipo", "id", "fecha", "usuario", "metodo/categoria", "concepto", "monto", "notas"].map(escapeCsv).join(","))
  for (const sale of sales) {
    csvLines.push(
      [
        "VENTA",
        sale.id,
        sale.created_at,
        sale.user_name || "",
        sale.payment_method,
        `Ticket ${sale.id}`,
        Number(sale.total || 0).toFixed(2),
        sale.notes || "",
      ]
        .map(escapeCsv)
        .join(",")
    )
  }

  for (const expense of expenses) {
    csvLines.push(
      [
        "GASTO",
        expense.id,
        expense.created_at,
        expense.user_name || "",
        expense.category,
        expense.concept,
        Number(expense.amount || 0).toFixed(2),
        expense.notes || "",
      ]
        .map(escapeCsv)
        .join(",")
    )
  }

  csvLines.push("")
  csvLines.push(["RESUMEN", "", "", "", "", "Ventas", salesTotal.toFixed(2), ""].map(escapeCsv).join(","))
  csvLines.push(["RESUMEN", "", "", "", "", "Gastos", expensesTotal.toFixed(2), ""].map(escapeCsv).join(","))
  csvLines.push(["RESUMEN", "", "", "", "", "Neto", neto.toFixed(2), ""].map(escapeCsv).join(","))
  
  const contentOut = csvLines.join("\n")

  return new NextResponse(contentOut, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cafeteria-reporte-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  })
}

