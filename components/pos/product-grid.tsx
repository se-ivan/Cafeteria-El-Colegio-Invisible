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
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500">
        No hay categorias configuradas.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input 
            type="text" 
            placeholder="Buscar productos..." 
            className="pl-10 h-12 bg-white rounded-xl shadow-sm border-gray-200 text-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {!searchQuery ? (
        <Tabs defaultValue={categories[0]?.id.toString()} className="flex flex-col flex-1 h-full min-h-0">
          <div className="mb-4 overflow-x-auto pb-1">
            <TabsList className="h-auto w-max min-w-full justify-start gap-2 bg-transparent p-0 flex-nowrap shrink-0">
              {categories.map((category) => {
                const Icon = getCategoryIcon(category.name);
                return (
                  <TabsTrigger
                    key={category.id}
                    value={category.id.toString()}
                    className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 bg-white border border-gray-200 px-5 py-3 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 font-medium shrink-0"
                  >
                    <Icon className="h-5 w-5" />
                    {category.name}
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </div>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id.toString()} className="mt-0 min-h-0 flex-1 h-full data-[state=inactive]:hidden">
              <ScrollArea className="h-full pr-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 pb-4">
                  {getProductsByCategory(category.id).map((product) => (
                    <Button
                      key={product.id}
                      onClick={() => onAddToCart(product)}
                      variant="outline"
                      className="h-auto min-h-[8rem] flex flex-col items-center justify-center gap-2 bg-white hover:bg-blue-50 hover:border-blue-200 border-gray-200 text-gray-800 hover:text-blue-600 transition-all rounded-xl shadow-sm p-3 whitespace-normal"
                    >
                      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 mb-1">
                         {(() => {
                           const ProductIcon = getCategoryIcon(category.name);
                           return <ProductIcon className="h-5 w-5" />
                         })()}
                      </div>
                      <span className="font-semibold text-center text-sm leading-tight line-clamp-2">
                        {product.name}
                      </span>
                      <span className="text-lg font-bold text-blue-500">${Number(product.price).toFixed(2)}</span>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <ScrollArea className="flex-1 h-full min-h-0 pr-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 pb-4">
            {getFilteredProducts().map((product) => {
               const category = categories.find(c => c.id === product.category_id);
               const Icon = category ? getCategoryIcon(category.name) : UtensilsCrossed;
               
               return (
                <Button
                  key={product.id}
                  onClick={() => onAddToCart(product)}
                  variant="outline"
                  className="h-auto min-h-[8rem] flex flex-col items-center justify-center gap-2 bg-white hover:bg-blue-50 hover:border-blue-200 border-gray-200 text-gray-800 hover:text-blue-600 transition-all rounded-xl shadow-sm p-3 whitespace-normal"
                >
                  <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 mb-1">
                     <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-semibold text-center text-sm leading-tight line-clamp-2">
                    {product.name}
                  </span>
                  <span className="text-lg font-bold text-blue-500">${Number(product.price).toFixed(2)}</span>
                </Button>
              )
            })}
            
            {getFilteredProducts().length === 0 && (
              <div className="col-span-full py-10 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-200">
                <Search className="h-8 w-8 mx-auto mb-3 text-gray-400 opacity-50" />
                <p>No se encontraron productos para "{searchQuery}"</p>
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
