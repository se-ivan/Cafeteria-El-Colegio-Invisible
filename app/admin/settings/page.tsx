import { auth } from "@/lib/auth"
import { hasPermission, PERMISSION_IDS } from "@/lib/permissions"
import { redirect } from "next/navigation"
import { SettingsPanel } from "@/components/admin/settings-panel"
import { getWhatsAppRecipients, getWorkersForSettings } from "@/lib/queries"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  if (!hasPermission(session.user, PERMISSION_IDS.SETTINGS_MANAGE)) {
    redirect("/pos")
  }

  const [workers, recipients] = await Promise.all([
    getWorkersForSettings(),
    getWhatsAppRecipients(),
  ])

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Configuracion</h1>
        <p className="text-slate-500 mt-1">Gestion de personal y alertas</p>
      </div>

      <SettingsPanel
        workers={workers}
        recipients={recipients}
        currentUserId={parseInt(session.user.id, 10)}
      />
    </div>
  )
}
