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
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Inventario</h1>
          <p className="text-stone-500">Gestiona tus insumos y stock</p>
        </div>
        <AddSupplyDialog />
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-stone-100 rounded-lg">
              <Package className="h-5 w-5 text-stone-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Total Insumos</p>
              <p className="text-2xl font-bold text-stone-800">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Disponibles</p>
              <p className="text-2xl font-bold text-green-600">{stats.ok}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Bajo Stock</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.low}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Agotados</p>
              <p className="text-2xl font-bold text-red-600">{stats.out}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockSupplies.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800">Insumos que requieren atencion</h3>
              <p className="text-sm text-yellow-700 mt-1">
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
