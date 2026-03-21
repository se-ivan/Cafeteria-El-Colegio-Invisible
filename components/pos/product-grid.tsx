"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Search, Coffee, Snowflake, Croissant, Utensils, UtensilsCrossed, PackageOpen, CakeSlice, CupSoda } from "lucide-react"
import type { Category, Product } from "@/lib/types"

interface ProductGridProps {
  categories: Category[]
  products: Product[]
  onAddToCart: (product: Product) => void
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

export function ProductGrid({ categories, products, onAddToCart }: ProductGridProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const getProductsByCategory = (categoryId: number) => {
    let filteredProducts = products.filter(p => p.category_id === categoryId)
    if (searchQuery) {
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    return filteredProducts
  }

  const getFilteredProducts = () => {
    if (!searchQuery) return products
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
  }

  if (categories.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-sm text-slate-500">
        No hay categorías configuradas.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-slate-50/30">
      <div className="mb-5 relative">
        <div className="relative shadow-sm rounded-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" strokeWidth={1.5} />
          <Input 
            type="text" 
            placeholder="Buscar productos..." 
            className="pl-11 h-14 bg-white rounded-2xl border-slate-200/80 text-base shadow-none focus-visible:ring-blue-500 placeholder:text-slate-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {!searchQuery ? (
        <Tabs defaultValue={categories[0]?.id.toString()} className="flex flex-col flex-1 h-full min-h-0">
          <div className="mb-5 overflow-x-auto pb-2 -mx-1 px-1 custom-scrollbar">
            <TabsList className="h-auto w-max min-w-full justify-start gap-2 bg-transparent p-0 flex-nowrap shrink-0">
              {categories.map((category) => {
                const Icon = getCategoryIcon(category.name);
                return (
                  <TabsTrigger
                    key={category.id}
                    value={category.id.toString()}
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border-blue-600 bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50 px-5 py-3.5 rounded-2xl transition-all whitespace-nowrap flex items-center gap-2.5 font-medium shrink-0"
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                    {category.name}
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </div>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id.toString()} className="mt-0 min-h-0 flex-1 h-full data-[state=inactive]:hidden focus-visible:outline-none focus-visible:ring-0">
              <ScrollArea className="h-full pr-4 -mr-4">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 pb-4">
                  {getProductsByCategory(category.id).map((product) => (
                    <Button
                      key={product.id}
                      onClick={() => onAddToCart(product)}
                      variant="outline"
                      className="h-auto min-h-36 flex flex-col items-center justify-center gap-3 bg-white hover:bg-slate-50 border-slate-200/80 text-slate-800 hover:text-blue-600 transition-all rounded-2xl shadow-sm hover:shadow-md p-4 whitespace-normal group"
                    >
                      <div className="h-12 w-12 shrink-0 rounded-2xl bg-slate-50 group-hover:bg-blue-50/50 flex items-center justify-center text-slate-500 group-hover:text-blue-600 transition-colors border border-slate-100 group-hover:border-blue-100 mb-1">
                         {(() => {
                           const ProductIcon = getCategoryIcon(category.name);
                           return <ProductIcon className="h-6 w-6" strokeWidth={1.5} />
                         })()}
                      </div>
                      <div className="flex flex-col items-center gap-1.5 w-full">
                        <span className="font-semibold text-center text-sm leading-tight line-clamp-2 w-full text-slate-700 group-hover:text-slate-900 transition-colors">
                          {product.name}
                        </span>
                        <span className="text-lg font-bold text-blue-600">${Number(product.price).toFixed(2)}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <ScrollArea className="flex-1 h-full min-h-0 pr-4 -mr-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 pb-4">
            {getFilteredProducts().map((product) => {
               const category = categories.find(c => c.id === product.category_id);
               const Icon = category ? getCategoryIcon(category.name) : UtensilsCrossed;
               
               return (
                <Button
                  key={product.id}
                  onClick={() => onAddToCart(product)}
                  variant="outline"
                  className="h-auto min-h-36 flex flex-col items-center justify-center gap-3 bg-white hover:bg-slate-50 border-slate-200/80 text-slate-800 hover:text-blue-600 transition-all rounded-2xl shadow-sm hover:shadow-md p-4 whitespace-normal group"
                >
                  <div className="h-12 w-12 shrink-0 rounded-2xl bg-slate-50 group-hover:bg-blue-50/50 flex items-center justify-center text-slate-500 group-hover:text-blue-600 transition-colors border border-slate-100 group-hover:border-blue-100 mb-1">
                     <Icon className="h-6 w-6" strokeWidth={1.5} />
                  </div>
                  <div className="flex flex-col items-center gap-1.5 w-full">
                    <span className="font-semibold text-center text-sm leading-tight line-clamp-2 w-full text-slate-700 group-hover:text-slate-900 transition-colors">
                      {product.name}
                    </span>
                    <span className="text-lg font-bold text-blue-600">${Number(product.price).toFixed(2)}</span>
                  </div>
                </Button>
              )
            })}
            
            {getFilteredProducts().length === 0 && (
              <div className="col-span-full py-16 flex flex-col items-center justify-center text-center text-slate-500 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/80 min-h-[50vh]">
                <Search className="h-10 w-10 mb-4 text-slate-300" strokeWidth={1.5} />
                <p className="text-base font-medium text-slate-600">No se encontraron productos</p>
                <p className="text-sm text-slate-400 mt-1">Acerca de &quot;{searchQuery}&quot;</p>
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
