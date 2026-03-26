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
import { createCategory } from "@/lib/actions"
import { Plus, Tag } from "lucide-react"

export function AddCategoryDialog() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await createCategory({ name })
      setOpen(false)
      setName("")
    } catch (error) {
      console.error("Error creating category:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-11 px-4 rounded-xl">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Categoría
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
        <div className="bg-slate-50/50 p-6 border-b border-slate-100">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <Tag className="h-5 w-5" />
              </div>
              Crear Categoría
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-base">
              Agrega una nueva categoría para productos.
            </DialogDescription>
          </DialogHeader>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name" className="text-sm font-semibold text-slate-700">Nombre</Label>
              <Input
                id="category-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Bebidas calientes"
                required
                className="h-11"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-11 px-6 rounded-xl">
              Cancelar
            </Button>
            <Button type="submit" className="h-11 px-6 rounded-xl bg-blue-600 text-white" disabled={isLoading || !name}>
              {isLoading ? (
                <>
                  <Spinner className="mr-2" />
                  Guardando...
                </>
              ) : (
                "Crear"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
