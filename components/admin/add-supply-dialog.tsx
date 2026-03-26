"use client"

import { useState } from "react"
import type { Category } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { createSupply } from "@/lib/actions"
import { Plus, Package, Scale, Hash, AlertTriangle, Coffee, Croissant, ShoppingBag, Droplets, UtensilsCrossed } from "lucide-react"
import { cn } from "@/lib/utils"

const CATEGORIES = [
  { id: "Bebidas", icon: Coffee, color: "text-amber-600", bg: "bg-amber-100", border: "border-amber-200" },
  { id: "Alimentos", icon: Croissant, color: "text-orange-600", bg: "bg-orange-100", border: "border-orange-200" },
  { id: "Desechables", icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-100", border: "border-blue-200" },
  { id: "Limpieza", icon: Droplets, color: "text-emerald-600", bg: "bg-emerald-100", border: "border-emerald-200" },
  { id: "Otros", icon: UtensilsCrossed, color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200" },
]

export function AddSupplyDialog({ categories }: { categories?: Category[] }) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    category: "Otros",
    unit: "pzas",
    currentStock: "",
    minStock: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await createSupply({
        name: formData.name,
        category: formData.category,
        unit: formData.unit,
        currentStock: parseFloat(formData.currentStock),
        minStock: parseFloat(formData.minStock),
      })
      setOpen(false)
      setFormData({ name: "", category: "Otros", unit: "pzas", currentStock: "", minStock: "" })
    } catch (error) {
      console.error("Error creating supply:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all hover:scale-[1.02]">
          <Plus className="h-5 w-5 mr-2" />
          Agregar Insumo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
        <div className="bg-slate-50/50 p-6 border-b border-slate-100">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <Package className="h-5 w-5" />
              </div>
              Nuevo Insumo
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-base">
              Identifica y agrega un nuevo insumo a tu inventario.
            </DialogDescription>
          </DialogHeader>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            
            {/* Categorías Visuales */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700">Categoría del Insumo</Label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {(categories && categories.length > 0 ? categories.map(c => ({ id: c.name })) : CATEGORIES).map((cat: any) => {
                  const Icon = cat.icon || Package
                  const isSelected = formData.category === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat.id })}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200",
                        isSelected 
                          ? "border-blue-300 bg-blue-50 shadow-md scale-[1.02]" 
                          : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50 hover:scale-[1.02] text-slate-500"
                      )}
                    >
                      <Icon className={cn("h-6 w-6 mb-1", isSelected ? "text-blue-600" : "text-slate-400")} />
                      <span className={cn("text-xs font-semibold", isSelected ? "text-blue-700" : "text-slate-500")}>
                        {cat.id}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Resto del formulario */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name" className="text-sm font-semibold text-slate-700">Nombre del Insumo</Label>
                <div className="relative group">
                  <Package className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    id="name"
                    className="pl-9 h-11 bg-white border-slate-200 focus-visible:ring-blue-500 rounded-xl"
                    placeholder="Ej. Café en grano, Leche Entera"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit" className="text-sm font-semibold text-slate-700">Unidad de Medida</Label>
                <div className="relative group">
                  <Scale className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    id="unit"
                    className="pl-9 h-11 bg-white border-slate-200 focus-visible:ring-blue-500 rounded-xl"
                    placeholder="kg, lt, pzas..."
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentStock" className="text-sm font-semibold text-slate-700">Stock Inicial</Label>
                <div className="relative group">
                  <Hash className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    id="currentStock"
                    className="pl-9 h-11 bg-white border-slate-200 focus-visible:ring-blue-500 rounded-xl font-medium"
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="minStock" className="text-sm font-semibold text-slate-700">Stock Mínimo (Alerta)</Label>
                <div className="relative group">
                  <AlertTriangle className="absolute left-3 top-3 h-4 w-4 text-yellow-500 transition-colors" />
                  <Input
                    id="minStock"
                    className="pl-9 h-11 bg-yellow-50/50 border-yellow-200 focus-visible:ring-yellow-500 rounded-xl"
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    required
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Te notificaremos cuando el stock caiga por debajo de este valor.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="h-11 px-6 rounded-xl font-medium border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="h-11 px-8 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-2" />
                  Guardando...
                </>
              ) : (
                "Guardar Insumo"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
