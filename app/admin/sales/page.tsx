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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-800">Ventas</h1>
        <p className="text-stone-500">Historial de ventas</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Ventas Hoy</p>
              <p className="text-2xl font-bold text-teal-600">${todaySales.total.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Receipt className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Transacciones Hoy</p>
              <p className="text-2xl font-bold text-blue-600">{todaySales.count}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Promedio por Venta</p>
              <p className="text-2xl font-bold text-green-600">
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
