"use client"

import { useState } from "react"
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
import { createProduct } from "@/lib/actions"
import { Plus, Utensils, DollarSign, Coffee, Snowflake, Croissant, CakeSlice, UtensilsCrossed, PackageOpen, CupSoda } from "lucide-react"
import type { Category } from "@/lib/types"
import { cn } from "@/lib/utils"

interface AddProductDialogProps {
  categories: Category[]
}

const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase()
  if (name.includes('caliente') || name.includes('cafe') || name.includes('café')) return Coffee
  if (name.includes('fria') || name.includes('fría') || name.includes('frappe') || name.includes('smoothie')) return Snowflake
  if (name.includes('desayuno') || name.includes('pan')) return Croissant
  if (name.includes('comida') || name.includes('almuerzo')) return Utensils
  if (name.includes('snack') || name.includes('botana') || name.includes('galletas')) return PackageOpen
  if (name.includes('postre') || name.includes('crepa') || name.includes('pastel')) return CakeSlice
  if (name.includes('bebida') || name.includes('refresco')) return CupSoda
  return UtensilsCrossed
}

export function AddProductDialog({ categories }: AddProductDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    categoryId: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await createProduct({
        name: formData.name,
        price: parseFloat(formData.price),
        categoryId: parseInt(formData.categoryId, 10),
      })
      setOpen(false)
      setFormData({ name: "", price: "", categoryId: "" })
    } catch (error) {
      console.error("Error creating product:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all hover:scale-[1.02]">
          <Plus className="h-5 w-5 mr-2" />
          Agregar Producto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
        <div className="bg-slate-50/50 p-6 border-b border-slate-100">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <Utensils className="h-5 w-5" />
              </div>
              Nuevo Producto
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-base">
              Registra un nuevo producto en tu menú de POS.
            </DialogDescription>
          </DialogHeader>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            
            {/* Categorías Visuales */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700">Categoría del Producto</Label>
              {categories.length === 0 ? (
                <div className="text-sm text-slate-500 p-4 bg-slate-50 border border-dashed rounded-xl">
                  No hay categorías configuradas.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {categories.map((category) => {
                    const Icon = getCategoryIcon(category.name)
                    const isSelected = formData.categoryId === category.id.toString()
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, categoryId: category.id.toString() })}
                        className={cn(
                          "flex flex-col items-center justify-center gap-2 p-3 min-h-20 rounded-xl border-2 transition-all duration-200",
                          isSelected 
                            ? "border-blue-300 bg-blue-50 shadow-md scale-[1.02]" 
                            : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50 hover:scale-[1.02] text-slate-500"
                        )}
                      >
                        <Icon className={cn("h-6 w-6 mb-1", isSelected ? "text-blue-600" : "text-slate-400")} />
                        <span className={cn("text-xs font-semibold text-center leading-tight", isSelected ? "text-blue-700" : "text-slate-500")}>
                          {category.name}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name" className="text-sm font-semibold text-slate-700">Nombre del Producto</Label>
                <div className="relative group">
                  <Utensils className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    id="name"
                    className="pl-9 h-11 bg-white border-slate-200 focus-visible:ring-blue-500 rounded-xl"
                    placeholder="Ej. Latte Vainilla, Galleta Choco..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-semibold text-slate-700">Precio (MXN)</Label>
                <div className="relative group">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    id="price"
                    className="pl-9 h-11 bg-white border-slate-200 focus-visible:ring-blue-500 rounded-xl font-medium text-lg"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
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
              disabled={isLoading || !formData.categoryId}
              className="h-11 px-8 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-2" />
                  Guardando...
                </>
              ) : (
                "Guardar Producto"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
