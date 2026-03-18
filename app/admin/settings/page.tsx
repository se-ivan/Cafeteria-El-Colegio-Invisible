import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SettingsPanel } from "@/components/admin/settings-panel"
import { getWhatsAppRecipients, getWorkersForSettings } from "@/lib/queries"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const [workers, recipients] = await Promise.all([
    getWorkersForSettings(),
    getWhatsAppRecipients(),
  ])

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-800">Configuracion</h1>
        <p className="text-stone-500">Gestion de personal y alertas</p>
      </div>

      <SettingsPanel
        workers={workers}
        recipients={recipients}
        currentUserId={parseInt(session.user.id, 10)}
      />
    </div>
  )
}
