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
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-400" />
        <Input
          placeholder="Buscar por ID o vendedor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-20">ID</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Vendedor</TableHead>
              <TableHead className="min-w-36">Metodo de Pago</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell className="font-mono text-stone-500">#{sale.id}</TableCell>
                <TableCell>{formatDate(sale.created_at)}</TableCell>
                <TableCell>{(sale as Sale & { user_name?: string }).user_name || "N/A"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="gap-1">
                    {sale.payment_method === "CASH" ? (
                      <>
                        <Banknote className="h-3 w-3" />
                        Efectivo
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-3 w-3" />
                        Tarjeta
                      </>
                    )}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-semibold">${sale.total}</TableCell>
              </TableRow>
            ))}
            {filteredSales.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-stone-500">
                  No se encontraron ventas
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
