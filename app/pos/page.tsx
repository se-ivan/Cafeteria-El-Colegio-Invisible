import {
  getCategories,
  getLowStockSupplies,
  getProducts,
  getTodaySales,
  getTodaySalesBreakdown,
} from "@/lib/queries"
import { POSClient } from "./pos-client"

export const dynamic = "force-dynamic"

export default async function POSPage() {
  const [categories, products, todaySales, salesBreakdown, lowStockSupplies] = await Promise.all([
    getCategories(),
    getProducts(),
    getTodaySales(),
    getTodaySalesBreakdown(),
    getLowStockSupplies(),
  ])

  return (
    <POSClient
      categories={categories}
      products={products}
      todaySales={todaySales}
      salesBreakdown={salesBreakdown}
      lowStockSupplies={lowStockSupplies}
    />
  )
}
