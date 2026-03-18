"use client"

import { useSession } from "next-auth/react"
import { logOut } from "@/lib/auth-actions"
import { Button } from "@/components/ui/button"
import { BookOpen, LogOut, User, TrendingUp } from "lucide-react"

interface POSHeaderProps {
  todaySales: { total: number; count: number }
}

export function POSHeader({ todaySales }: POSHeaderProps) {
  const { data: session } = useSession()

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-md shadow-blue-500/20">
          <BookOpen className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="font-semibold text-gray-900">El Colegio Invisible</h1>
          <p className="text-xs text-gray-500">Punto de Venta</p>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-xl">
          <TrendingUp className="h-4 w-4 text-blue-500" />
          <div className="text-right">
            <p className="text-xs text-gray-500">Ventas hoy</p>
            <p className="font-bold text-gray-900">${todaySales.total.toFixed(2)} <span className="text-xs font-normal text-gray-500">({todaySales.count})</span></p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
            <User className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700 font-medium">{session?.user?.name || "Usuario"}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => logOut()}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
