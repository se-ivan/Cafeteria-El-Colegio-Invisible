"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "./status-badge"
import { updateSupplyStock, updateSupplyMinStock, deleteSupply } from "@/lib/actions"
import { Pencil, Save, Trash2, X, Search } from "lucide-react"
import type { Supply, SupplyStatus } from "@/lib/types"

interface InventoryTableProps {
  supplies: Supply[]
}

export function InventoryTable({ supplies }: InventoryTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editStock, setEditStock] = useState("")
  const [editMinStock, setEditMinStock] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<SupplyStatus | "ALL">("ALL")
  const [isUpdating, setIsUpdating] = useState(false)

  const filteredSupplies = supplies.filter((supply) => {
    const matchesSearch = supply.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "ALL" || supply.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleEdit = (supply: Supply) => {
    setEditingId(supply.id)
    setEditStock(supply.current_stock.toString())
    setEditMinStock(supply.min_stock.toString())
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditStock("")
    setEditMinStock("")
  }

  const handleSave = async (supplyId: number) => {
    setIsUpdating(true)
    try {
      await updateSupplyStock(supplyId, parseFloat(editStock))
      await updateSupplyMinStock(supplyId, parseFloat(editMinStock))
      setEditingId(null)
    } catch (error) {
      console.error("Error updating supply:", error)
    } finally {
      setIsUpdating(false)
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
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            placeholder="Buscar insumo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(["ALL", "OK", "LOW", "OUT"] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className={statusFilter === status ? "bg-teal-600 hover:bg-teal-700" : ""}
            >
              {status === "ALL" ? "Todos" : status === "OK" ? "OK" : status === "LOW" ? "Bajo" : "Agotado"}
              <span className="ml-1 text-xs">({statusCounts[status]})</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Insumo</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead className="text-right">Stock Actual</TableHead>
              <TableHead className="text-right">Minimo</TableHead>
              <TableHead>Estatus</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSupplies.map((supply) => (
              <TableRow key={supply.id}>
                <TableCell className="font-medium">{supply.name}</TableCell>
                <TableCell className="text-stone-500">{supply.unit}</TableCell>
                <TableCell className="text-right">
                  {editingId === supply.id ? (
                    <Input
                      type="number"
                      value={editStock}
                      onChange={(e) => setEditStock(e.target.value)}
                      className="w-24 text-right"
                      step="0.01"
                    />
                  ) : (
                    <span className="font-mono">{supply.current_stock}</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {editingId === supply.id ? (
                    <Input
                      type="number"
                      value={editMinStock}
                      onChange={(e) => setEditMinStock(e.target.value)}
                      className="w-24 text-right"
                      step="0.01"
                    />
                  ) : (
                    <span className="font-mono text-stone-500">{supply.min_stock}</span>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge status={supply.status} />
                </TableCell>
                <TableCell className="text-right">
                  {editingId === supply.id ? (
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleSave(supply.id)}
                        disabled={isUpdating}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={handleCancel}
                        disabled={isUpdating}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleEdit(supply)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(supply.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filteredSupplies.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-stone-500">
                  No se encontraron insumos
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
