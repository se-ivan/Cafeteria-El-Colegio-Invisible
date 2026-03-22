import { auth } from "@/lib/auth"
import { canAccessAdminArea } from "@/lib/permissions"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Menu } from "lucide-react"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }
  
  if (!canAccessAdminArea(session.user)) {
    redirect("/pos")
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <AdminSidebar className="hidden md:flex shrink-0 w-64 h-full" user={session.user} />

      <div className="flex min-w-0 flex-1 flex-col h-screen md:ml-64 overflow-hidden">
        <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/80 px-4 py-3 backdrop-blur-md md:hidden shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold tracking-tight text-slate-900">Admin</p>
              <p className="text-[10px] font-medium text-blue-500 uppercase tracking-widest mt-0.5">El Colegio Invisible</p>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="border-slate-100 shadow-sm rounded-lg hover:bg-slate-50 text-slate-600">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[86vw] max-w-xs p-0 border-r border-slate-100 shadow-xl">
                <SheetHeader className="sr-only">
                  <SheetTitle>Navegacion de administracion</SheetTitle>
                  <SheetDescription>
                    Accesos a inventario, productos, ventas y configuracion.
                  </SheetDescription>
                </SheetHeader>
                <AdminSidebar className="h-full w-full border-r-0 shadow-none" user={session.user} />
              </SheetContent>
            </Sheet>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 relative">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
