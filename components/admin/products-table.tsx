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
import { Badge } from "@/components/ui/badge"
import { RecipeDialog } from "./recipe-dialog"
import { updateProduct } from "@/lib/actions"
import { Pencil, Save, X, Search, UtensilsCrossed } from "lucide-react"
import type { Product, Category, Supply } from "@/lib/types"

interface ProductsTableProps {
  products: Product[]
  categories: Category[]
  supplies: Supply[]
}

export function ProductsTable({ products, categories, supplies }: ProductsTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editPrice, setEditPrice] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [recipeProductId, setRecipeProductId] = useState<number | null>(null)

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === null || product.category_id === categoryFilter
    return matchesSearch && matchesCategory
  })

  const getCategoryName = (categoryId: number) => {
    return categories.find(c => c.id === categoryId)?.name || "Sin categoria"
  }

  const handleEdit = (product: Product) => {
    setEditingId(product.id)
    setEditName(product.name)
    setEditPrice(product.price.toString())
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditName("")
    setEditPrice("")
  }

  const handleSave = async (product: Product) => {
    setIsUpdating(true)
    try {
      await updateProduct(product.id, {
        name: editName,
        price: parseFloat(editPrice),
        categoryId: product.category_id,
        isActive: product.is_active
      })
      setEditingId(null)
    } catch (error) {
      console.error("Error updating product:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={categoryFilter === null ? "default" : "outline"}
            size="sm"
            onClick={() => setCategoryFilter(null)}
            className={categoryFilter === null ? "bg-teal-600 hover:bg-teal-700" : ""}
          >
            Todos
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={categoryFilter === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter(category.id)}
              className={categoryFilter === category.id ? "bg-teal-600 hover:bg-teal-700" : ""}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-52">Producto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="min-w-28 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">
                  {editingId === product.id ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full"
                    />
                  ) : (
                    product.name
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{getCategoryName(product.category_id)}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {editingId === product.id ? (
                    <Input
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-24 text-right"
                      step="0.01"
                    />
                  ) : (
                    <span className="font-mono">${product.price}</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={product.is_active ? "default" : "secondary"}>
                    {product.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {editingId === product.id ? (
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleSave(product)}
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
                        onClick={() => setRecipeProductId(product.id)}
                        title="Configurar receta"
                      >
                        <UtensilsCrossed className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleEdit(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filteredProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-stone-500">
                  No se encontraron productos
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Recipe Dialog */}
      {recipeProductId && (
        <RecipeDialog
          open={!!recipeProductId}
          onOpenChange={(open) => !open && setRecipeProductId(null)}
          productId={recipeProductId}
          productName={products.find(p => p.id === recipeProductId)?.name || ""}
          supplies={supplies}
        />
      )}
    </div>
  )
}
