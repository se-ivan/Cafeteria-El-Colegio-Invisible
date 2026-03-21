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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Productos</h1>
          <p className="text-slate-500 mt-1">Gestiona tu menu y recetas</p>
        </div>
        <AddProductDialog categories={categories} />
      </div>

      {/* Stats */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden mb-6">
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 bg-blue-50 rounded-xl">
            <ShoppingBag className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Total Productos</p>
            <p className="text-3xl font-bold text-slate-900">{products.length}</p>
          </div>
        </div>
      </div>

      <ProductsTable products={products} categories={categories} supplies={supplies} />
    </div>
  )
}
