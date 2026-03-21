"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "./status-badge"
import { EditSupplyDialog } from "./edit-supply-dialog"
import { updateSupplyStock, updateSupplyMinStock, deleteSupply } from "@/lib/actions"
import { Pencil, Save, Trash2, X, Search, Package, Layers, Droplets, Egg, Coffee } from "lucide-react"
import type { Supply, SupplyStatus } from "@/lib/types"

interface InventoryTableProps {
  supplies: Supply[]
}

const getInventoryStyles = (categoryName: string) => {
  const name = (categoryName || "").toLowerCase()
  if (name.includes("bebida") || name.includes("liquido") || name.includes("líquido") || name.includes("agua")) return { icon: <Droplets className="h-10 w-10 text-cyan-600" />, bg: "bg-cyan-100", text: "text-cyan-700" }
  if (name.includes("comida") || name.includes("alimento") || name.includes("pan")) return { icon: <Egg className="h-10 w-10 text-orange-500" />, bg: "bg-orange-100", text: "text-orange-700" }
  if (name.includes("cafe") || name.includes("café")) return { icon: <Coffee className="h-10 w-10 text-yellow-700" />, bg: "bg-yellow-100", text: "text-yellow-800" }
  return { icon: <Layers className="h-10 w-10 text-violet-500" />, bg: "bg-violet-100", text: "text-violet-700" }
}

export function InventoryTable({ supplies }: InventoryTableProps) {
  const [selectedSupply, setSelectedSupply] = useState<Supply | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<SupplyStatus | "ALL">("ALL")
  const [isUpdating, setIsUpdating] = useState(false)

  const filteredSupplies = supplies.filter((supply) => {
    const matchesSearch = supply.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "ALL" || supply.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleEdit = (supply: Supply) => {
    setSelectedSupply(supply)
    setIsEditDialogOpen(true)
  }

  const handleSave = async (supplyId: number, currentStock: number, minStock: number) => {
    try {
      await updateSupplyStock(supplyId, currentStock)
      await updateSupplyMinStock(supplyId, minStock)
    } catch (error) {
      console.error("Error updating supply:", error)
      throw error // Re-throw to be caught by the modal
    }
  }

  const handleDelete = async (supplyId: number) => {
    if (confirm("Estas seguro de eliminar este insumo?")) {
      try {
        await deleteSupply(supplyId)
      } catch (error) {
        console.error("Error deleting supply:", error)
      }
    }
  }

  const statusCounts = {
    ALL: supplies.length,
    OK: supplies.filter(s => s.status === "OK").length,
    LOW: supplies.filter(s => s.status === "LOW").length,
    OUT: supplies.filter(s => s.status === "OUT").length,
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar insumo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 border-slate-200 focus-visible:ring-blue-500 focus-visible:border-blue-500 rounded-xl bg-white"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["ALL", "OK", "LOW", "OUT"] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className={statusFilter === status ? "bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm" : "bg-white rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"}
            >
              {status === "ALL" ? "Todos" : status === "OK" ? "OK" : status === "LOW" ? "Bajo" : "Agotado"}
              <span className="ml-1.5 text-[10px] bg-white/20 px-1.5 rounded-full">{statusCounts[status]}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredSupplies.map((supply) => {
          const { icon, bg, text } = getInventoryStyles(supply.category || "Otros")
          return (
          <Card key={supply.id} className="flex flex-col overflow-hidden hover:shadow-md transition-all duration-200 border-slate-100 bg-white group">
            <div className={`${bg} h-28 flex justify-center items-center relative transition-transform duration-300 group-hover:scale-[1.02]`}>
              <div className="scale-90 group-hover:scale-100 transition-transform duration-300">
                {icon}
              </div>
              <div className="absolute top-3 right-3 shadow-sm rounded-full">
                <StatusBadge status={supply.status} />
              </div>
              <div className="absolute bottom-3 left-3">
                <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-semibold bg-white/90 ${text} shadow-sm backdrop-blur-md`}>
                  {supply.category || "Otros"}
                </span>
              </div>
            </div>

            <CardContent className="p-4 flex-1 flex flex-col gap-2">
              <h3 className="font-semibold text-slate-900 text-base leading-tight line-clamp-2" title={supply.name}>
                {supply.name}
              </h3>
              
              <div className="flex items-center justify-between text-sm mt-auto pt-2">
                <div className="flex flex-col">
                  <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">Stock Actual</span>
                  <div className="text-lg font-semibold text-slate-900 mt-0.5">
                    {supply.current_stock} <span className="text-xs font-medium text-slate-500">{supply.unit}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">Mínimo</span>
                  <div className="text-sm font-medium text-slate-500 mt-1">
                    {supply.min_stock}
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-3 border-t border-slate-50 bg-slate-50/50 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm rounded-lg flex-1"
                onClick={() => handleEdit(supply)}
              >
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-white border-slate-200 text-red-500 hover:text-red-700 hover:bg-red-50 hover:border-red-100 shadow-sm rounded-lg"
                onClick={() => handleDelete(supply.id)}
                title="Eliminar"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </CardFooter>
          </Card>
        )})}

        {filteredSupplies.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center font-medium">
            <Package className="h-12 w-12 text-slate-300 mb-3" />
            <span>No se encontraron insumos</span>
          </div>
        )}
      </div>

      <EditSupplyDialog
        supply={selectedSupply}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSave}
      />
    </div>
  )
}
