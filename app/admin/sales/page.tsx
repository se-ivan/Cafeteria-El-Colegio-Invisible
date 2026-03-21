import { getSales, getTodaySales } from "@/lib/queries"
import { SalesTable } from "@/components/admin/sales-table"
import { Receipt, DollarSign, TrendingUp } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function SalesPage() {
  const [sales, todaySales] = await Promise.all([
    getSales(100),
    getTodaySales()
  ])

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Ventas</h1>
        <p className="text-slate-500 mt-1">Historial de ventas</p>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-blue-50 rounded-xl">
              <DollarSign className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Ventas Hoy</p>
              <p className="text-3xl font-bold text-slate-900">${todaySales.total.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Receipt className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Transacciones Hoy</p>
              <p className="text-3xl font-bold text-slate-900">{todaySales.count}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-blue-50 rounded-xl">
              <TrendingUp className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Promedio por Venta</p>
              <p className="text-3xl font-bold text-slate-900">
                ${todaySales.count > 0 ? (todaySales.total / todaySales.count).toFixed(2) : "0.00"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <SalesTable sales={sales} />
    </div>
  )
}
