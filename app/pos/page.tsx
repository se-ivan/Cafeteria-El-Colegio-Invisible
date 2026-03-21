import {
  getCategories,
  getCashSessionWithdrawals,
  getOpenCashSessionByUser,
  getOpenCashSessionSummary,
  getLowStockSupplies,
  getProducts,
  getTodaySales,
  getTodaySalesBreakdown,
} from "@/lib/queries"
import { auth } from "@/lib/auth"
import { hasPermission, PERMISSION_IDS } from "@/lib/permissions"
import { redirect } from "next/navigation"
import { POSClient } from "./pos-client"

export const dynamic = "force-dynamic"

export default async function POSPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  if (!hasPermission(session.user, PERMISSION_IDS.POS_ACCESS)) {
    redirect("/admin")
  }

  const canManageInventory = hasPermission(session.user, PERMISSION_IDS.INVENTORY_MANAGE)

  const userId = session?.user?.id ? parseInt(session.user.id, 10) : null

  const [categories, products, todaySales, salesBreakdown, lowStockSupplies, openCashSession] = await Promise.all([
    getCategories(),
    getProducts(),
    getTodaySales(),
    getTodaySalesBreakdown(),
    getLowStockSupplies(),
    userId ? getOpenCashSessionByUser(userId) : Promise.resolve(null),
  ])

  const [cashSessionSummary, cashWithdrawals] = openCashSession
    ? await Promise.all([
        getOpenCashSessionSummary(openCashSession.id),
        getCashSessionWithdrawals(openCashSession.id),
      ])
    : [null, []]

  return (
    <POSClient
      categories={categories}
      products={products}
      todaySales={todaySales}
      salesBreakdown={salesBreakdown}
      lowStockSupplies={lowStockSupplies}
      canManageInventory={canManageInventory}
      openCashSession={openCashSession}
      cashSessionSummary={cashSessionSummary}
      cashWithdrawals={cashWithdrawals}
    />
  )
}
