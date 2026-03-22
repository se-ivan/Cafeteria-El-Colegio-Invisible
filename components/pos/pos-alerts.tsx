import { AlertTriangle, Package } from "lucide-react"
import type { Supply } from "@/lib/types"

interface POSAlertsProps {
  lowStockSupplies: Supply[]
}

export function POSAlerts({ lowStockSupplies }: POSAlertsProps) {
  if (lowStockSupplies.length === 0) {
    return null
  }

  const critical = lowStockSupplies.filter((s) => s.status === "OUT")
  const low = lowStockSupplies.filter((s) => s.status === "LOW")

  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="mb-2 flex items-center gap-2 text-amber-800">
        <AlertTriangle className="h-4 w-4" />
        <p className="text-sm font-semibold">Alertas de inventario para cafeteria</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-amber-900">
        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1">
          <Package className="h-3 w-3" />
          {critical.length} agotados
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1">
          <Package className="h-3 w-3" />
          {low.length} con stock bajo
        </span>
      </div>
    </div>
  )
}
