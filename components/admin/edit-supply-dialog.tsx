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
import { Scale, Hash, AlertTriangle } from "lucide-react"
import type { Supply } from "@/lib/types"

interface EditSupplyDialogProps {
  supply: Supply | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (id: number, currentStock: number, minStock: number) => Promise<void>
}

export function EditSupplyDialog({ supply, open, onOpenChange, onSave }: EditSupplyDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    currentStock: "",
    minStock: "",
  })

  useEffect(() => {
    if (supply) {
      setFormData({
        currentStock: supply.current_stock.toString(),
        minStock: supply.min_stock.toString(),
      })
    }
  }, [supply])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supply) return
    
    setIsLoading(true)
    try {
      await onSave(
        supply.id,
        parseFloat(formData.currentStock),
        parseFloat(formData.minStock)
      )
      onOpenChange(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Insumo: {supply?.name}</DialogTitle>
          <DialogDescription>
            Actualiza el stock actual o mínimo de este insumo ({supply?.unit}).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editCurrentStock">Stock Actual</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="editCurrentStock"
                    className="pl-9"
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editMinStock">Stock Mínimo</Label>
                <div className="relative">
                  <AlertTriangle className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="editMinStock"
                    className="pl-9"
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
