"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Edit, Trash2, Save, X } from "lucide-react"
import type { Category } from "@/lib/types"
import { updateCategory, deleteCategory } from "@/lib/actions"

interface ManageCategoriesProps {
  categories: Category[]
}

export function ManageCategories({ categories }: ManageCategoriesProps) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [name, setName] = useState("")

  const startEdit = (c: Category) => {
    setEditingId(c.id)
    setName(c.name)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setName("")
  }

  const handleSave = async (id: number) => {
    try {
      await updateCategory(id, { name })
      // refresh
      window.location.reload()
    } catch (err) {
      console.error(err)
      alert("No se pudo actualizar la categoría")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Eliminar categoría? Esto desvinculará productos asociados.")) return
    try {
      await deleteCategory(id)
      window.location.reload()
    } catch (err) {
      console.error(err)
      alert("No se pudo eliminar la categoría")
    }
  }

  return (
    <div className="mt-4">
      <Label className="text-sm font-semibold text-slate-700">Gestionar Categorías</Label>
      <div className="mt-2 grid gap-2">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-2">
            {editingId === c.id ? (
              <>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
                <Button onClick={() => handleSave(c.id)} className="h-9 px-3">
                  <Save className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={cancelEdit} className="h-9 px-3">
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <div className="flex-1 text-sm">{c.name}</div>
                <Button onClick={() => startEdit(c)} className="h-9 px-3">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="destructive" onClick={() => handleDelete(c.id)} className="h-9 px-3">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
