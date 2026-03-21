import { getSupplies, getLowStockSupplies } from "@/lib/queries"
import { InventoryTable } from "@/components/admin/inventory-table"
import { AddSupplyDialog } from "@/components/admin/add-supply-dialog"
import { Package, AlertTriangle, CheckCircle } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function InventoryPage() {
  const [supplies, lowStockSupplies] = await Promise.all([
    getSupplies(),
    getLowStockSupplies()
  ])

  const stats = {
    total: supplies.length,
    ok: supplies.filter(s => s.status === "OK").length,
    low: supplies.filter(s => s.status === "LOW").length,
    out: supplies.filter(s => s.status === "OUT").length,
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inventario</h1>
          <p className="text-sm text-slate-500 mt-1">Gestiona el catálogo de insumos y verifica el stock disponible.</p>
        </div>
        <AddSupplyDialog />
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Package className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Insumos</p>
              <p className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Disponibles</p>
              <p className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5">{stats.ok}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Bajo Stock</p>
              <p className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5">{stats.low}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Agotados</p>
              <p className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5">{stats.out}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockSupplies.length > 0 && (
        <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-4 mb-8 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400"></div>
          <div className="flex items-start gap-3 pl-2">
            <div className="p-2 bg-amber-100 rounded-lg shrink-0">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-800 text-sm">Atención requerida: Insumos bajos</h3>
              <p className="text-sm text-amber-700/80 mt-1 leading-relaxed">
                {lowStockSupplies.map(s => s.name).join(", ")}
              </p>
            </div>
          </div>
        </div>
      )}

      <InventoryTable supplies={supplies} />
    </div>
  )
}
