"use client"

import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Search, ReceiptText } from "lucide-react"
import type { Expense } from "@/lib/types"

type ExpensesTableProps = {
  expenses: Expense[]
}

function formatAmount(value: number) {
  return `$${Number(value || 0).toFixed(2)}`
}

function formatDate(value: Date | string) {
  const date = new Date(value)
  return date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function ExpensesTable({ expenses }: ExpensesTableProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredExpenses = useMemo(() => {
    const safeQuery = searchTerm.trim().toLowerCase()
    if (!safeQuery) return expenses

    return expenses.filter((expense) => {
      return (
        expense.concept.toLowerCase().includes(safeQuery) ||
        expense.category.toLowerCase().includes(safeQuery) ||
        (expense.user_name || "").toLowerCase().includes(safeQuery)
      )
    })
  }, [expenses, searchTerm])

  return (
    <div className="space-y-6">
      <div className="relative max-w-lg">
        <Search className="h-5 w-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" strokeWidth={1.5} />
        <Input
          placeholder="Buscar por concepto, categoría o usuario..."
          className="pl-11 h-12 rounded-xl border-slate-200 bg-slate-50/50 shadow-none focus-visible:ring-blue-500 placeholder:text-slate-400 text-base"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      {filteredExpenses.length === 0 ? (
        <div className="bg-slate-50/50 border border-dashed border-slate-200/60 rounded-2xl p-16 text-center text-slate-500">
          <ReceiptText className="h-12 w-12 mx-auto text-slate-300 mb-4" strokeWidth={1.5} />
          <p className="text-sm font-medium text-slate-600">No hay gastos registrados</p>
          <p className="text-xs text-slate-400 mt-1">Intenta buscar con otros términos.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-slate-50/50 text-slate-500 uppercase text-[10px] tracking-widest font-semibold border-b border-slate-100">
                <tr>
                  <th className="text-left px-6 py-4">Fecha</th>
                  <th className="text-left px-6 py-4">Concepto</th>
                  <th className="text-left px-6 py-4">Categoría</th>
                  <th className="text-left px-6 py-4">Registrado por</th>
                  <th className="text-left px-6 py-4">Notas</th>
                  <th className="text-right px-6 py-4">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 text-slate-500">{formatDate(expense.created_at)}</td>
                    <td className="px-6 py-4 text-slate-900 font-medium">{expense.concept}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 group-hover:bg-white border border-slate-200/60">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{expense.user_name || "Sistema"}</td>
                    <td className="px-6 py-4 text-slate-500 max-w-50 truncate">{expense.notes || "-"}</td>
                    <td className="px-6 py-4 text-right font-semibold text-slate-900">
                      {formatAmount(expense.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
