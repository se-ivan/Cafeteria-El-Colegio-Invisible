"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { RecipeDialog } from "./recipe-dialog"
import { updateProduct } from "@/lib/actions"
import { Pencil, Save, X, Search, UtensilsCrossed, Package, Coffee, Milk, Cookie, Wine } from "lucide-react"
import type { Product, Category, Supply } from "@/lib/types"

interface ProductsTableProps {
  products: Product[]
  categories: Category[]
  supplies: Supply[]
}

const getCategoryStyles = (categoryName: string) => {
  const name = categoryName.toLowerCase()
  if (name.includes("bebida") || name.includes("café") || name.includes("cafe")) return { icon: <Coffee className="h-10 w-10 text-amber-600" />, bg: "bg-amber-100", text: "text-amber-700" }
  if (name.includes("lácteo") || name.includes("lacteo") || name.includes("leche")) return { icon: <Milk className="h-10 w-10 text-sky-500" />, bg: "bg-sky-100", text: "text-sky-700" }
  if (name.includes("postre") || name.includes("dulce")) return { icon: <Cookie className="h-10 w-10 text-rose-500" />, bg: "bg-rose-100", text: "text-rose-700" }
  if (name.includes("alcohol") || name.includes("licor") || name.includes("cerveza")) return { icon: <Wine className="h-10 w-10 text-fuchsia-600" />, bg: "bg-fuchsia-100", text: "text-fuchsia-700" }
  return { icon: <Package className="h-10 w-10 text-emerald-600" />, bg: "bg-emerald-100", text: "text-emerald-700" }
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
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 border-slate-200 focus-visible:ring-blue-500 focus-visible:border-blue-500 rounded-xl bg-white"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={categoryFilter === null ? "default" : "outline"}
            size="sm"
            onClick={() => setCategoryFilter(null)}
            className={categoryFilter === null ? "bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm" : "bg-white rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"}
          >
            Todos
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={categoryFilter === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter(category.id)}
              className={categoryFilter === category.id ? "bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm" : "bg-white rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid view */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredProducts.map((product) => {
          const { icon, bg, text } = getCategoryStyles(getCategoryName(product.category_id))
          return (
          <Card key={product.id} className="flex flex-col overflow-hidden hover:shadow-md transition-all duration-200 border-slate-100 bg-white group">
            {/* Image Placeholder / Icon area */}
            <div className={`${bg} h-32 flex justify-center items-center relative transition-transform duration-300 group-hover:scale-[1.02]`}>
              <div className="scale-90 group-hover:scale-100 transition-transform duration-300">
                {icon}
              </div>
              <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                <Badge variant="secondary" className={`bg-white/90 backdrop-blur-md shadow-sm font-semibold rounded-md px-2 ${text} border-none text-[10px] uppercase tracking-wider`}>
                  {getCategoryName(product.category_id)}
                </Badge>
                {!product.is_active && (
                  <Badge variant="destructive" className="shadow-sm rounded-md text-[10px] uppercase tracking-wider font-semibold">Inactivo</Badge>
                )}
              </div>
            </div>

            <CardContent className="p-4 pt-4 flex-1 flex flex-col gap-3">
              {editingId === product.id ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Nombre</label>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-9 text-sm w-full rounded-lg border-slate-200 focus-visible:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Precio</label>
                    <Input
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="h-9 text-sm w-full rounded-lg border-slate-200 focus-visible:ring-blue-500"
                      step="0.01"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 text-base leading-tight line-clamp-2" title={product.name}>
                      {product.name}
                    </h3>
                  </div>
                  <div className="font-semibold text-lg text-blue-600">
                    ${Number(product.price).toFixed(2)}
                  </div>
                </>
              )}
            </CardContent>

            <CardFooter className="p-3 border-t border-slate-50 bg-slate-50/50 flex justify-between">
              {editingId === product.id ? (
                <div className="flex justify-end gap-2 w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isUpdating}
                    className="flex-1 h-8 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-100"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleSave(product)}
                    disabled={isUpdating}
                    className="flex-1 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Guardar
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(product)}
                    className="flex-1 h-8 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm rounded-lg"
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRecipeProductId(product.id)}
                    className="flex-1 h-8 bg-blue-50/50 border-blue-100 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-colors shadow-sm rounded-lg"
                    title="Configurar receta"
                  >
                    <UtensilsCrossed className="h-3.5 w-3.5 mr-1" />
                    Receta
                  </Button>
                </div>
              )}
            </CardFooter>
          </Card>
        )})}

        {filteredProducts.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200 font-medium">
            <Package className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            No se encontraron productos
          </div>
        )}
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
