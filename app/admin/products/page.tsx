import { getProducts, getCategories, getSupplies } from "@/lib/queries"
import { ProductsTable } from "@/components/admin/products-table"
import { AddProductDialog } from "@/components/admin/add-product-dialog"
import { ShoppingBag } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ProductsPage() {
  const [products, categories, supplies] = await Promise.all([
    getProducts(),
    getCategories(),
    getSupplies()
  ])

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Productos</h1>
          <p className="text-stone-500">Gestiona tu menu y recetas</p>
        </div>
        <AddProductDialog categories={categories} />
      </div>

      {/* Stats */}
      <div className="bg-white p-4 rounded-lg border mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-100 rounded-lg">
            <ShoppingBag className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <p className="text-sm text-stone-500">Total Productos</p>
            <p className="text-2xl font-bold text-stone-800">{products.length}</p>
          </div>
        </div>
      </div>

      <ProductsTable products={products} categories={categories} supplies={supplies} />
    </div>
  )
}
