"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { logOut } from "@/lib/auth-actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { LogOut, User, TrendingUp, Wallet, Banknote, CreditCard, Boxes } from "lucide-react"

interface POSHeaderProps {
  todaySales: { total: number; count: number }
  salesBreakdown: { cashTotal: number; cardTotal: number; tickets: number }
}

export function POSHeader({ todaySales, salesBreakdown }: POSHeaderProps) {
  const { data: session } = useSession()
  const [isCashDialogOpen, setIsCashDialogOpen] = useState(false)

  const averageTicket = useMemo(() => {
    if (salesBreakdown.tickets === 0) return 0
    return todaySales.total / salesBreakdown.tickets
  }, [salesBreakdown.tickets, todaySales.total])

  return (
    <header className="border-b border-gray-100 bg-white px-3 py-3 sm:px-4 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-100 bg-cyan-50 sm:h-11 sm:w-11">
          <Image
            src="/logoColegioInvisible.svg"
            alt="El Colegio Invisible"
            width={26}
            height={26}
            className="h-6 w-6"
          />
        </div>
        <div>
          <h1 className="font-semibold text-gray-900">El Colegio Invisible</h1>
          <p className="text-[11px] text-gray-500 sm:text-xs">Punto de Venta y Caja</p>
        </div>
      </div>

      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end sm:gap-3 lg:gap-4">
        <div className="flex items-center gap-2 rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2 sm:px-4">
          <TrendingUp className="h-4 w-4 text-blue-500" />
          <div className="text-right">
            <p className="text-xs text-gray-500">Ventas hoy</p>
            <p className="font-bold text-gray-900">${todaySales.total.toFixed(2)} <span className="text-xs font-normal text-gray-500">({todaySales.count})</span></p>
          </div>
        </div>

        <Button asChild variant="outline" size="sm" className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50">
          <Link href="/admin/inventory">
            <Boxes className="h-4 w-4" />
            <span>Inventario</span>
          </Link>
        </Button>

        <Dialog open={isCashDialogOpen} onOpenChange={setIsCashDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 border-cyan-200 text-cyan-700 hover:bg-cyan-50">
              <Wallet className="h-4 w-4" />
              Gestion de caja
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resumen de caja del dia</DialogTitle>
              <DialogDescription>
                Monitoreo rapido por metodo de pago para corte de caja.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-emerald-700">
                  <Banknote className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-wide">Efectivo</p>
                </div>
                <p className="text-xl font-bold text-emerald-900">${salesBreakdown.cashTotal.toFixed(2)}</p>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-blue-700">
                  <CreditCard className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-wide">Tarjeta</p>
                </div>
                <p className="text-xl font-bold text-blue-900">${salesBreakdown.cardTotal.toFixed(2)}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Ticket promedio</p>
                <p className="text-xl font-bold text-slate-900">${averageTicket.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <span>Tickets del dia</span>
              <Badge variant="secondary">{salesBreakdown.tickets}</Badge>
            </div>
          </DialogContent>
        </Dialog>

        <div className="ml-auto flex items-center gap-2 sm:ml-0 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 sm:flex">
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
      </div>
    </header>
  )
}
