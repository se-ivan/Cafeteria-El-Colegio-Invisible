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
    <header className="border-b border-slate-100 bg-white px-3 py-3 sm:px-4 lg:px-6 shadow-[0_1px_2px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 sm:h-11 sm:w-11 relative overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 bg-blue-500/10"></div>
          <Image
            src="/logoColegioInvisible.svg"
            alt="El Colegio Invisible"
            width={24}
            height={24}
            className="h-5 w-5 relative z-10"
          />
        </div>
        <div className="flex flex-col">
          <h1 className="text-sm font-semibold tracking-tight text-slate-900">El Colegio Invisible</h1>
          <p className="text-[10px] font-medium text-blue-500 uppercase tracking-widest mt-0.5">POS & Caja</p>
        </div>
      </div>

      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end sm:gap-3 lg:gap-4">
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2 sm:px-4">
          <TrendingUp className="h-4 w-4 text-blue-500" />
          <div className="text-right">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Ventas hoy</p>
            <p className="font-semibold text-slate-900 leading-none">${todaySales.total.toFixed(2)} <span className="text-xs font-medium text-slate-400">({todaySales.count})</span></p>
          </div>
        </div>

        <Button asChild variant="outline" size="sm" className="gap-2 border-slate-100 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm h-10 rounded-xl">
          <Link href="/admin/inventory">
            <Boxes className="h-4 w-4 text-slate-400" />
            <span>Inventario</span>
          </Link>
        </Button>

        <Dialog open={isCashDialogOpen} onOpenChange={setIsCashDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 border-blue-100/50 bg-blue-50/30 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors shadow-sm h-10 rounded-xl">
              <Wallet className="h-4 w-4" />
              Gestión de caja
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl">Resumen de caja</DialogTitle>
              <DialogDescription>
                Monitoreo general de ingresos segmentados.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 py-4">
              <div className="rounded-xl border border-blue-50 bg-blue-50/50 p-4 transition-colors">
                <div className="mb-2 flex items-center gap-2 text-blue-600">
                  <Banknote className="h-4 w-4" />
                  <p className="text-[11px] font-semibold uppercase tracking-wider">Efectivo</p>
                </div>
                <p className="text-2xl font-semibold text-slate-900">${salesBreakdown.cashTotal.toFixed(2)}</p>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-100/30 p-4 transition-colors">
                <div className="mb-2 flex items-center gap-2 text-blue-600">
                  <CreditCard className="h-4 w-4" />
                  <p className="text-[11px] font-semibold uppercase tracking-wider">Tarjeta</p>
                </div>
                <p className="text-2xl font-semibold text-slate-900">${salesBreakdown.cardTotal.toFixed(2)}</p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Ticket prom.</p>
                <p className="text-xl font-semibold text-slate-900 mt-1">${averageTicket.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600 font-medium">
              <span>Total de tickets emitidos</span>
              <Badge className="bg-white text-slate-900 border border-slate-200 shadow-sm hover:bg-white">{salesBreakdown.tickets}</Badge>
            </div>
          </DialogContent>
        </Dialog>

        <div className="ml-auto flex items-center gap-2 sm:ml-0 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2 sm:flex shadow-sm h-10">
            <User className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-700 font-medium">{session?.user?.name || "Usuario"}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => logOut()}
            className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl h-10 w-10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
      </div>
    </header>
  )
}
