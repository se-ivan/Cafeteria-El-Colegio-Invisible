import { auth } from "@/lib/auth"
import { hasPermission, PERMISSION_IDS } from "@/lib/permissions"
import { redirect } from "next/navigation"
import { FileText, CalendarDays } from "lucide-react"

export const dynamic = "force-dynamic"

function getTodayDate() {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  const localDate = new Date(now.getTime() - offset * 60 * 1000)
  return localDate.toISOString().slice(0, 10)
}

export default async function ReportsPage() {
  const session = await auth()
  if (!session?.user?.id || !hasPermission(session.user, PERMISSION_IDS.REPORTS_VIEW)) {
    redirect("/pos")
  }

  const today = getTodayDate()

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reportes</h1>
        <p className="text-slate-500 mt-1">Descarga reportes diarios de ventas y gastos para control operativo.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Reporte Diario</h2>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Incluye ventas y gastos del día seleccionado con resumen de neto.
          </p>
          <div className="flex gap-2">
            <a 
              href={`/api/report/daily?date=${today}&format=xlsx`} 
              className="inline-flex flex-1 justify-center h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 w-full"
            >
              Descargar Reporte del Día (Excel)
            </a>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <CalendarDays className="h-5 w-5 text-blue-500" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Fecha específica</h2>
          </div>
          <form action="/api/report/daily" method="get" className="space-y-3">
            <label htmlFor="report-date" className="text-sm text-slate-600">Fecha del reporte</label>
            <input
              id="report-date"
              name="date"
              type="date"
              defaultValue={today}
              className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm"
            />
            <input type="hidden" name="format" value="xlsx" />
            <button 
              type="submit" 
              className="w-full inline-flex justify-center h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
            >
              Descargar Fecha Seleccionada (Excel)
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}



