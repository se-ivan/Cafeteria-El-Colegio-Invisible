"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { logOut } from "@/lib/auth-actions"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Receipt,
  Settings,
  LogOut,
  Monitor,
} from "lucide-react"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/inventory", label: "Inventario", icon: Package },
  { href: "/admin/products", label: "Productos", icon: ShoppingBag },
  { href: "/admin/sales", label: "Ventas", icon: Receipt },
  { href: "/admin/settings", label: "Configuracion", icon: Settings },
]

interface AdminSidebarProps {
  className?: string
  onNavigate?: () => void
}

export function AdminSidebar({ className, onNavigate }: AdminSidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <aside className={cn("w-64 bg-white border-r border-slate-100 flex flex-col h-full shadow-sm", className)}>
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-500/10"></div>
            <Image
              src="/logoColegioInvisible.svg"
              alt="El Colegio Invisible"
              width={20}
              height={20}
              className="relative z-10"
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold tracking-tight text-slate-900">El Colegio</h1>
            <p className="text-[10px] font-medium text-blue-500 uppercase tracking-widest mt-0.5">Admin</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-4 text-[11px]">Menu Principal</p>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium",
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className={cn("h-4 w-4 transition-colors", isActive ? "text-blue-500" : "text-slate-400 group-hover:text-slate-900")} />
              <span>{item.label}</span>
            </Link>
          )
        })}

        <div className="pt-4 mt-4">
          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 text-[11px]">Sistema</p>
          <Link
            href="/pos"
            onClick={onNavigate}
            className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200"
          >
            <Monitor className="h-4 w-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
            <span>Terminal POS</span>
          </Link>
        </div>
      </nav>

      {/* User Info */}
      <div className="p-4 mt-auto border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-blue-700">
              {session?.user?.name?.charAt(0) || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate pr-2">{session?.user?.name || "Usuario"}</p>
            <p className="text-[11px] text-slate-500 truncate">{session?.user?.email || "admin@elcolegio.com"}</p>
          </div>
          <button
            onClick={() => {
              onNavigate?.()
              logOut()
            }}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
