"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { logOut } from "@/lib/auth-actions"
import { closeCashSession, openCashSession as openCashSessionAction, registerCashWithdrawal } from "@/lib/actions"
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { LogOut, User, TrendingUp, Wallet, Banknote, CreditCard, Boxes } from "lucide-react"
import type { CashSession, CashWithdrawal } from "@/lib/types"

interface POSHeaderProps {
  todaySales: { total: number; count: number }
  salesBreakdown: { cashTotal: number; cardTotal: number; tickets: number }
  canManageInventory: boolean
  openCashSession: CashSession | null
  cashSessionSummary: {
    cashSalesTotal: number
    cardSalesTotal: number
    expensesTotal: number
    withdrawalsTotal: number
    expectedCash: number
  } | null
  cashWithdrawals: CashWithdrawal[]
}

export function POSHeader({
  todaySales,
  salesBreakdown,
  canManageInventory,
  openCashSession,
  cashSessionSummary,
  cashWithdrawals,
}: POSHeaderProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [isCashDialogOpen, setIsCashDialogOpen] = useState(false)
  const [openingAmount, setOpeningAmount] = useState("")
  const [openingNotes, setOpeningNotes] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawReason, setWithdrawReason] = useState("")
  const [closingAmount, setClosingAmount] = useState("")
  const [closingNotes, setClosingNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const averageTicket = useMemo(() => {
    if (salesBreakdown.tickets === 0) return 0
    return todaySales.total / salesBreakdown.tickets
  }, [salesBreakdown.tickets, todaySales.total])

  const handleOpenSession = async () => {
    try {
      setIsSubmitting(true)
      await openCashSessionAction({
        openingAmount: Number(openingAmount || 0),
        notes: openingNotes,
      })
      toast.success("Sesión de caja abierta")
      setOpeningAmount("")
      setOpeningNotes("")
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo abrir la sesión"
      toast.error("Error al abrir caja", { description: message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRegisterWithdrawal = async () => {
    try {
      setIsSubmitting(true)
      await registerCashWithdrawal({
        amount: Number(withdrawAmount || 0),
        reason: withdrawReason,
      })
      toast.success("Retiro registrado")
      setWithdrawAmount("")
      setWithdrawReason("")
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo registrar el retiro"
      toast.error("Error al registrar retiro", { description: message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseSession = async () => {
    try {
      setIsSubmitting(true)
      const result = await closeCashSession({
        closingAmount: Number(closingAmount || 0),
        notes: closingNotes,
      })

      toast.success("Sesión cerrada", {
        description: `Diferencia final: $${result.variance.toFixed(2)}`,
      })

      window.open(result.exportUrl, "_blank", "noopener,noreferrer")

      setClosingAmount("")
      setClosingNotes("")
      setIsCashDialogOpen(false)
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo cerrar la sesión"
      toast.error("Error al cerrar caja", { description: message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <header className="border-b border-slate-100 bg-white px-3 py-3 sm:px-4 lg:px-6 shadow-[0_1px_2px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-50 sm:h-11 sm:w-11">
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

        {canManageInventory ? (
          <Button asChild variant="outline" size="sm" className="gap-2 border-slate-100 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm h-10 rounded-xl">
            <Link href="/admin/inventory">
              <Boxes className="h-4 w-4 text-slate-400" />
              <span>Inventario</span>
            </Link>
          </Button>
        ) : null}

        <Dialog open={isCashDialogOpen} onOpenChange={setIsCashDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 border-blue-100/50 bg-blue-50/30 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors shadow-sm h-10 rounded-xl">
              <Wallet className="h-4 w-4" />
              Gestión de caja
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-slate-100 shadow-2xl rounded-2xl">
            <div className="bg-white px-6 pt-6 pb-4 sm:px-8 sm:pt-8">
              <DialogHeader className="mb-6 flex flex-row items-start justify-between space-y-0">
                <div>
                  <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900">
                    Caja operativa
                  </DialogTitle>
                  <DialogDescription className="mt-1.5 text-sm text-slate-500">
                    Control de ingresos, retiros y cierres de turno.
                  </DialogDescription>
                </div>
                <div>
                  {openCashSession ? (
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 font-medium px-3 py-1 rounded-full">
                      Sesión abierta
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 font-medium px-3 py-1 rounded-full">
                      Sesión cerrada
                    </Badge>
                  )}
                </div>
              </DialogHeader>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 transition-all">
                  <div className="mb-2 flex items-center gap-2 text-slate-500">
                    <Banknote className="h-4 w-4" />
                    <p className="text-xs font-semibold uppercase tracking-widest">Efectivo</p>
                  </div>
                  <p className="text-3xl font-bold tracking-tight text-slate-900">${(cashSessionSummary?.cashSalesTotal ?? salesBreakdown.cashTotal).toFixed(2)}</p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 transition-all">
                  <div className="mb-2 flex items-center gap-2 text-slate-500">
                    <CreditCard className="h-4 w-4" />
                    <p className="text-xs font-semibold uppercase tracking-widest">Tarjeta</p>
                  </div>
                  <p className="text-3xl font-bold tracking-tight text-slate-900">${(cashSessionSummary?.cardSalesTotal ?? salesBreakdown.cardTotal).toFixed(2)}</p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 transition-all">
                  <div className="mb-2 flex items-center gap-2 text-slate-500">
                    <TrendingUp className="h-4 w-4" />
                    <p className="text-xs font-semibold uppercase tracking-widest">Ticket Prom</p>
                  </div>
                  <p className="text-3xl font-bold tracking-tight text-slate-900">${averageTicket.toFixed(2)}</p>
                </div>
              </div>

              {openCashSession && cashSessionSummary && (
                <div className="mb-6 grid grid-cols-2 gap-x-8 gap-y-4 rounded-2xl border border-slate-100 bg-white p-5 text-sm sm:grid-cols-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Apertura</span>
                    <span className="font-semibold text-slate-900 text-base">${openCashSession.opening_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Esperado</span>
                    <span className="font-semibold text-blue-600 text-base">${cashSessionSummary.expectedCash.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Gastos</span>
                    <span className="font-semibold text-rose-600 text-base">${cashSessionSummary.expensesTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Retiros</span>
                    <span className="font-semibold text-amber-600 text-base">${cashSessionSummary.withdrawalsTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50/50 px-6 py-6 sm:px-8 border-t border-slate-100">
              {!openCashSession ? (
                <div className="mx-auto max-w-md space-y-4">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-slate-900">Iniciar turno</h3>
                    <p className="text-sm text-slate-500">Ingresa el fondo inicial para habilitar las ventas.</p>
                  </div>
                  <div className="space-y-3">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={openingAmount}
                      onChange={(e) => setOpeningAmount(e.target.value)}
                      placeholder="Monto de apertura ($0.00)"
                      className="h-12 rounded-xl border-slate-200 bg-white text-lg shadow-sm placeholder:text-slate-400 focus-visible:ring-blue-500"
                    />
                    <Textarea
                      value={openingNotes}
                      onChange={(e) => setOpeningNotes(e.target.value)}
                      placeholder="Notas adicionales (opcional)"
                      rows={2}
                      className="resize-none rounded-xl border-slate-200 bg-white text-sm shadow-sm placeholder:text-slate-400 focus-visible:ring-blue-500"
                    />
                    <Button onClick={handleOpenSession} disabled={isSubmitting} className="h-12 w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-base font-medium shadow-sm hover:shadow-md transition-all">
                      Abrir caja
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="flex flex-col space-y-4 rounded-2xl bg-white p-5 border border-slate-100 shadow-sm">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Retiro operativo</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Saca efectivo para compras o pagos menores.</p>
                    </div>
                    <div className="space-y-3 flex-1">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="Monto a retirar"
                        className="h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-slate-300"
                      />
                      <Input
                        value={withdrawReason}
                        onChange={(e) => setWithdrawReason(e.target.value)}
                        placeholder="Motivo del retiro"
                        className="h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-slate-300"
                      />
                      <Button onClick={handleRegisterWithdrawal} disabled={isSubmitting} variant="outline" className="w-full h-11 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50">
                        Registrar retiro
                      </Button>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Últimos retiros</p>
                      <div className="max-h-24 overflow-y-auto space-y-1 pr-2">
                        {cashWithdrawals.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No hay retiros.</p>
                        ) : (
                          cashWithdrawals.slice(0, 5).map((withdrawal) => (
                            <div key={withdrawal.id} className="flex justify-between items-center text-xs">
                              <span className="text-slate-600 truncate mr-2">{withdrawal.reason}</span>
                              <span className="text-slate-900 font-medium">-${withdrawal.amount.toFixed(2)}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-4 rounded-2xl bg-rose-50/30 p-5 border border-rose-100 shadow-sm">
                    <div>
                      <h3 className="text-sm font-semibold text-rose-900">Corte y cierre</h3>
                      <p className="text-xs text-rose-600/80 mt-0.5">Finaliza el turno actual y reporta el conteo.</p>
                    </div>
                    <div className="space-y-3 flex-1 flex flex-col justify-end">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={closingAmount}
                        onChange={(e) => setClosingAmount(e.target.value)}
                        placeholder="Efectivo en caja (conteo físico)"
                        className="h-11 rounded-xl border-rose-200 bg-white focus-visible:ring-rose-400 text-rose-900 placeholder:text-rose-300"
                      />
                      <Textarea
                        value={closingNotes}
                        onChange={(e) => setClosingNotes(e.target.value)}
                        placeholder="Observaciones de cierre (ej. faltantes)"
                        rows={2}
                        className="resize-none rounded-xl border-rose-200 bg-white focus-visible:ring-rose-400 text-rose-900 placeholder:text-rose-300 sm:text-sm"
                      />
                      <div className="pt-2">
                         <Button onClick={handleCloseSession} disabled={isSubmitting} className="w-full h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-sm transition-all">
                           Cerrar caja
                         </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
