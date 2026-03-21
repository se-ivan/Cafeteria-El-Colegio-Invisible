import { auth } from "@/lib/auth"
import { canAccessAdminArea, hasPermission, PERMISSION_IDS } from "@/lib/permissions"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }
  
  if (canAccessAdminArea(session.user)) {
    redirect("/admin/inventory")
  }

  if (hasPermission(session.user, PERMISSION_IDS.POS_ACCESS)) {
    redirect("/pos")
  }

  redirect("/login")
}
