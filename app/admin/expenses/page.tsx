import { AddExpenseDialog } from "@/components/admin/add-expense-dialog"
import { ExpensesTable } from "@/components/admin/expenses-table"
import { auth } from "@/lib/auth"
import { hasPermission, PERMISSION_IDS } from "@/lib/permissions"
import { getExpenses, getTodayExpenses } from "@/lib/queries"
import { redirect } from "next/navigation"
import { HandCoins, ReceiptText } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ExpensesPage() {
  const session = await auth()
  if (!session?.user?.id || !hasPermission(session.user, PERMISSION_IDS.EXPENSES_MANAGE)) {
    redirect("/pos")
  }

  const [expenses, today] = await Promise.all([getExpenses(), getTodayExpenses()])

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gastos</h1>
          <p className="text-slate-500 mt-1">Control de egresos con notificaciones automáticas</p>
        </div>
        <AddExpenseDialog />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-blue-50 rounded-xl">
              <HandCoins className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Gasto de Hoy</p>
              <p className="text-3xl font-bold text-slate-900">${today.total.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-blue-50 rounded-xl">
              <ReceiptText className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Registros Hoy</p>
              <p className="text-3xl font-bold text-slate-900">{today.count}</p>
            </div>
          </div>
        </div>
      </div>

      <ExpensesTable expenses={expenses} />
    </div>
  )
}
