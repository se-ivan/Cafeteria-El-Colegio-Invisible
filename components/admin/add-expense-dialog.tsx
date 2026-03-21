"use client"

import { useState, useTransition } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createExpense } from "@/lib/actions"
import { HandCoins, Plus } from "lucide-react"
import { toast } from "sonner"

const EXPENSE_CATEGORIES = ["OPERATIVOS", "PROVEEDORES", "SERVICIOS", "OTROS"]

export function AddExpenseDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({
    concept: "",
    category: "OPERATIVOS",
    amount: "",
    notes: "",
  })

  const resetForm = () => {
    setFormData({
      concept: "",
      category: "OPERATIVOS",
      amount: "",
      notes: "",
    })
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    startTransition(async () => {
      try {
        await createExpense({
          concept: formData.concept,
          category: formData.category,
          amount: Number(formData.amount),
          notes: formData.notes,
        })

        toast.success("Gasto registrado", {
          description: "Se guardo el gasto y se enviaron notificaciones.",
        })

        resetForm()
        setOpen(false)
      } catch (error) {
        toast.error("No se pudo registrar el gasto", {
          description: error instanceof Error ? error.message : "Intenta nuevamente.",
        })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm">
          <Plus className="h-4 w-4 mr-2" />
          Registrar Gasto
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-slate-100 shadow-2xl rounded-2xl">
        <div className="bg-slate-50/50 p-6 border-b border-slate-100/60">
          <DialogHeader className="flex flex-row items-center gap-4 space-y-0 text-left">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white border border-slate-100 shadow-sm text-blue-600">
              <HandCoins className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold tracking-tight text-slate-900">
                Nuevo Gasto
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500 mt-0.5">
                Registra un egreso y notifica al equipo de inmediato.
              </DialogDescription>
            </div>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-white">
          <div className="space-y-2.5">
            <Label htmlFor="expense-concept" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Concepto</Label>
            <Input
              id="expense-concept"
              placeholder="Ej. Compra de vasos"
              className="h-11 border-slate-200 rounded-xl bg-slate-50/50 shadow-none focus-visible:ring-blue-500 placeholder:text-slate-400"
              value={formData.concept}
              onChange={(event) => setFormData((prev) => ({ ...prev, concept: event.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2.5">
              <Label htmlFor="expense-category" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Categoría</Label>
              <div className="relative">
                <select
                  id="expense-category"
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none shadow-none"
                  value={formData.category}
                  onChange={(event) => setFormData((prev) => ({ ...prev, category: event.target.value }))}
                >
                  {EXPENSE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="expense-amount" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Monto</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                <Input
                  id="expense-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  className="h-11 pl-7 border-slate-200 rounded-xl bg-slate-50/50 shadow-none focus-visible:ring-blue-500"
                  value={formData.amount}
                  onChange={(event) => setFormData((prev) => ({ ...prev, amount: event.target.value }))}
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="expense-notes" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Notas (opcional)</Label>
            <Textarea
              id="expense-notes"
              placeholder="Detalles adicionales"
              className="border-slate-200 rounded-xl min-h-24 bg-slate-50/50 shadow-none focus-visible:ring-blue-500 resize-none sm:text-sm"
              value={formData.notes}
              onChange={(event) => setFormData((prev) => ({ ...prev, notes: event.target.value }))}
            />
          </div>

          <DialogFooter className="pt-6 border-t border-slate-100 gap-3 sm:gap-0 mt-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 sm:mr-3"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all px-8"
              disabled={isPending}
            >
              {isPending ? "Guardando..." : "Guardar gasto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
