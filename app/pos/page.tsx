import { getCategories, getProducts, getTodaySales } from "@/lib/queries"
import { POSClient } from "./pos-client"

export const dynamic = "force-dynamic"

export default async function POSPage() {
  const [categories, products, todaySales] = await Promise.all([
    getCategories(),
    getProducts(),
    getTodaySales()
  ])

  return (
    <POSClient
      categories={categories}
      products={products}
      todaySales={todaySales}
    />
  )
}
