"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateRecipe, getRecipeAction } from "@/lib/actions"
import { Plus, Trash2 } from "lucide-react"
import type { Supply, RecipeItem } from "@/lib/types"

interface RecipeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: number
  productName: string
  supplies: Supply[]
}

interface RecipeEntry {
  supplyId: number
  quantity: number
}

export function RecipeDialog({ open, onOpenChange, productId, productName, supplies }: RecipeDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [recipeItems, setRecipeItems] = useState<RecipeEntry[]>([])
  const [newSupplyId, setNewSupplyId] = useState("")

  // Load existing recipe when dialog opens
  useEffect(() => {
    if (open && productId) {
      setIsLoading(true)
      getRecipeAction(productId)
        .then((items: RecipeItem[]) => {
          setRecipeItems(items.map(item => ({
            supplyId: item.supply_id,
            quantity: item.quantity
          })))
        })
        .catch(console.error)
        .finally(() => setIsLoading(false))
    }
  }, [open, productId])

  const handleAddItem = () => {
    if (!newSupplyId) return
    const supplyId = parseInt(newSupplyId, 10)
    
    // Check if already added
    if (recipeItems.some(item => item.supplyId === supplyId)) {
      return
    }

    setRecipeItems([...recipeItems, { supplyId, quantity: 1 }])
    setNewSupplyId("")
  }

  const handleUpdateQuantity = (supplyId: number, quantity: number) => {
    setRecipeItems(items =>
      items.map(item =>
        item.supplyId === supplyId ? { ...item, quantity } : item
      )
    )
  }

  const handleRemoveItem = (supplyId: number) => {
    setRecipeItems(items => items.filter(item => item.supplyId !== supplyId))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateRecipe(productId, recipeItems)
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving recipe:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const getSupplyName = (supplyId: number) => {
    return supplies.find(s => s.id === supplyId)?.name || "Desconocido"
  }

  const getSupplyUnit = (supplyId: number) => {
    return supplies.find(s => s.id === supplyId)?.unit || ""
  }

  const availableSupplies = supplies.filter(
    s => !recipeItems.some(item => item.supplyId === s.id)
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Receta: {productName}</DialogTitle>
          <DialogDescription>
            Define los insumos necesarios para preparar este producto.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="h-6 w-6" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Add new item */}
            <div className="flex gap-2">
              <Select value={newSupplyId} onValueChange={setNewSupplyId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecciona un insumo" />
                </SelectTrigger>
                <SelectContent>
                  {availableSupplies.map((supply) => (
                    <SelectItem key={supply.id} value={supply.id.toString()}>
                      {supply.name} ({supply.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                onClick={handleAddItem}
                disabled={!newSupplyId}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Recipe items list */}
            <ScrollArea className="h-[300px]">
              {recipeItems.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No hay insumos en la receta
                </div>
              ) : (
                <div className="space-y-2">
                  {recipeItems.map((item) => (
                    <div
                      key={item.supplyId}
                      className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {getSupplyName(item.supplyId)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {getSupplyUnit(item.supplyId)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`qty-${item.supplyId}`} className="sr-only">
                          Cantidad
                        </Label>
                        <Input
                          id={`qty-${item.supplyId}`}
                          type="number"
                          step="0.001"
                          min="0"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateQuantity(item.supplyId, parseFloat(e.target.value) || 0)
                          }
                          className="w-20 text-right"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleRemoveItem(item.supplyId)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSaving ? (
              <>
                <Spinner className="mr-2" />
                Guardando...
              </>
            ) : (
              "Guardar Receta"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
