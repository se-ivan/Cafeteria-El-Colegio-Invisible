import { AdminDashboardPanel } from "@/components/admin/admin-dashboard-panel"
import { auth } from "@/lib/auth"
import { hasPermission, PERMISSION_IDS } from "@/lib/permissions"
import { getAdminDashboardData } from "@/lib/queries"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user?.id || !hasPermission(session.user, PERMISSION_IDS.ADMIN_DASHBOARD)) {
    redirect("/pos")
  }

  const data = await getAdminDashboardData()

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Panel de Control</h1>
        <p className="text-sm text-slate-500 mt-1">Monitorea KPIs, miembros del equipo y rendimiento de ventas.</p>
      </div>

      <AdminDashboardPanel
        kpis={data.kpis}
        salesByDay={data.salesByDay}
        paymentSplitMonth={data.paymentSplitMonth}
        sellerPerformance={data.sellerPerformance}
        members={data.members}
      />
    </div>
  )
}
