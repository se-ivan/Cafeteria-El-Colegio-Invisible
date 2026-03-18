"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { logOut } from "@/lib/auth-actions"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Package,
  ShoppingBag,
  Receipt,
  Settings,
  LogOut,
  Monitor,
} from "lucide-react"

const navItems = [
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
    <aside className={cn("w-64 bg-white border-r border-slate-200/80 flex flex-col", className)}>
      {/* Logo */}
      <div className="p-5 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center">
            <Image
              src="/logoColegioInvisible.svg"
              alt="El Colegio Invisible"
              width={22}
              height={22}
              className="h-5 w-5"
            />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">El Colegio Invisible</h1>
            <p className="text-xs text-gray-500">Panel de Administracion</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
                isActive
                  ? "bg-cyan-50 text-cyan-700 border border-cyan-100"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive ? "text-cyan-600" : "")} />
              <span>{item.label}</span>
            </Link>
          )
        })}

        <div className="pt-4 mt-4 border-t border-gray-100">
          <Link
            href="/pos"
            onClick={onNavigate}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-cyan-50 hover:text-cyan-700 transition-all font-medium"
          >
            <Monitor className="h-5 w-5" />
            <span>Ir al POS</span>
          </Link>
        </div>
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <div className="w-9 h-9 rounded-lg bg-cyan-100 flex items-center justify-center">
            <span className="text-sm font-semibold text-cyan-700">
              {session?.user?.name?.charAt(0) || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{session?.user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              onNavigate?.()
              logOut()
            }}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
