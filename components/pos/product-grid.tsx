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

  return (
    <Tabs defaultValue={categories[0]?.id.toString()} className="flex flex-col h-full">
      <TabsList className="w-full justify-start gap-2 bg-transparent p-0 h-auto flex-wrap mb-4">
        {categories.map((category) => (
          <TabsTrigger
            key={category.id}
            value={category.id.toString()}
            className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 bg-white border border-gray-200 px-5 py-2.5 rounded-xl transition-all"
          >
            {category.name}
          </TabsTrigger>
        ))}
      </TabsList>

      {categories.map((category) => (
        <TabsContent key={category.id} value={category.id.toString()} className="flex-1 mt-0">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
