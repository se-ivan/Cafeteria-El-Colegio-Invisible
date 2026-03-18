import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }
  
  // Redirect based on role
  if (session.user.role === "ADMIN") {
    redirect("/admin/inventory")
  } else {
    redirect("/pos")
  }
}
