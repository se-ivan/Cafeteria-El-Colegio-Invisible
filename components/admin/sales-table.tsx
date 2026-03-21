"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Banknote, CreditCard } from "lucide-react"
import type { Sale } from "@/lib/types"

interface SalesTableProps {
  sales: Sale[]
}

export function SalesTable({ sales }: SalesTableProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredSales = sales.filter((sale) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      sale.id.toString().includes(searchLower) ||
      (sale as Sale & { user_name?: string }).user_name?.toLowerCase().includes(searchLower)
    )
  })

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar por ID o vendedor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 h-10 border-slate-200 focus-visible:ring-blue-500 focus-visible:border-blue-500 rounded-xl"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-slate-100 hover:bg-transparent">
              <TableHead className="min-w-20 font-semibold text-slate-600">ID</TableHead>
              <TableHead className="font-semibold text-slate-600">Fecha</TableHead>
              <TableHead className="font-semibold text-slate-600">Vendedor</TableHead>
              <TableHead className="min-w-36 font-semibold text-slate-600">Método de Pago</TableHead>
              <TableHead className="text-right font-semibold text-slate-600">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.map((sale) => (
              <TableRow key={sale.id} className="border-slate-100 transition-colors hover:bg-slate-50/50">
                <TableCell className="font-mono text-xs text-blue-600">#{sale.id}</TableCell>
                <TableCell className="text-sm font-medium text-slate-700">{formatDate(sale.created_at)}</TableCell>
                <TableCell className="text-sm text-slate-600">{(sale as Sale & { user_name?: string }).user_name || "N/A"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={sale.payment_method === "CASH" ? "gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700 shadow-none font-medium px-2.5 py-0.5 rounded-lg" : "gap-1.5 border-blue-200 bg-blue-50 text-blue-700 shadow-none font-medium px-2.5 py-0.5 rounded-lg"}>
                    {sale.payment_method === "CASH" ? (
                      <>
                        <Banknote className="h-3.5 w-3.5" />
                        Efectivo
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-3.5 w-3.5" />
                        Tarjeta
                      </>
                    )}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-semibold text-slate-900">${sale.total}</TableCell>
              </TableRow>
            ))}
            {filteredSales.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-500 font-medium">
                  No se encontraron ventas para esta búsqueda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
