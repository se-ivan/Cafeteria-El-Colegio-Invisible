"use client"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Category, Product } from "@/lib/types"

interface ProductGridProps {
  categories: Category[]
  products: Product[]
  onAddToCart: (product: Product) => void
}

export function ProductGrid({ categories, products, onAddToCart }: ProductGridProps) {
  const getProductsByCategory = (categoryId: number) => {
    return products.filter(p => p.category_id === categoryId)
  }

  if (categories.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500">
        No hay categorias configuradas.
      </div>
    )
  }

  return (
    <Tabs defaultValue={categories[0]?.id.toString()} className="flex flex-col h-full">
      <div className="mb-4 overflow-x-auto pb-1">
        <TabsList className="h-auto w-max min-w-full justify-start gap-2 bg-transparent p-0">
          {categories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id.toString()}
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 bg-white border border-gray-200 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap"
            >
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {categories.map((category) => (
        <TabsContent key={category.id} value={category.id.toString()} className="mt-0 min-h-0 flex-1">
          <ScrollArea className="h-full">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {getProductsByCategory(category.id).map((product) => (
                <Button
                  key={product.id}
                  onClick={() => onAddToCart(product)}
                  variant="outline"
                  className="h-28 flex flex-col items-center justify-center gap-2 bg-white hover:bg-blue-50 hover:border-blue-200 border-gray-200 text-gray-800 hover:text-blue-600 transition-all rounded-xl shadow-sm"
                >
                  <span className="font-medium text-center text-sm leading-tight line-clamp-2">
                    {product.name}
                  </span>
                  <span className="text-xl font-bold text-blue-500">${product.price}</span>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      ))}
    </Tabs>
  )
}
