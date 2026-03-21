"use client"

import { useMemo, useState, useTransition } from "react"
import { createAdminMember, resetMemberPassword } from "@/lib/actions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  AlertTriangle,
  CreditCard,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  UserPlus,
  Users,
  KeyRound,
} from "lucide-react"

type DashboardKpis = {
  todaySalesTotal: number
  todaySalesCount: number
  todayExpensesTotal: number
  monthSalesTotal: number
  monthSalesCount: number
  monthExpensesTotal: number
  monthNetTotal: number
  activeSellers: number
  lowStockSupplies: number
}

type DashboardChartPoint = {
  day: string
  sales: number
  expenses: number
}

type DashboardSellerPerformance = {
  userId: number
  name: string
  salesCount: number
  revenue: number
  averageTicket: number
}

type DashboardMember = {
  id: number
  name: string
  email: string
  role: "ADMIN" | "CASHIER"
  created_at: Date
}

type AdminDashboardPanelProps = {
  kpis: DashboardKpis
  salesByDay: DashboardChartPoint[]
  paymentSplitMonth: {
    cash: number
    card: number
  }
  sellerPerformance: DashboardSellerPerformance[]
  members: DashboardMember[]
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value)
}

function formatDate(value: Date) {
  return new Date(value).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function ResetPasswordDialog({
  userId,
  userName,
}: {
  userId: number
  userName: string
}) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const onSubmit = () => {
    setError(null)
    startTransition(async () => {
      try {
        await resetMemberPassword(userId, password)
        setPassword("")
        setOpen(false)
      } catch (err) {
        const message = err instanceof Error ? err.message : "No se pudo restablecer la contrasena"
        setError(message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <KeyRound className="mr-2 h-3.5 w-3.5" />
          Reset
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restablecer contrasena</DialogTitle>
          <DialogDescription>
            Define una nueva contrasena para {userName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor={`reset-password-${userId}`}>Nueva contrasena</Label>
          <Input
            id={`reset-password-${userId}`}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimo 6 caracteres"
            minLength={6}
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={isPending || password.length < 6}>
            {isPending ? "Guardando..." : "Actualizar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AdminDashboardPanel({
  kpis,
  salesByDay,
  paymentSplitMonth,
  sellerPerformance,
  members,
}: AdminDashboardPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [memberName, setMemberName] = useState("")
  const [memberEmail, setMemberEmail] = useState("")
  const [memberPassword, setMemberPassword] = useState("")
  const [memberRole, setMemberRole] = useState<"ADMIN" | "CASHIER">("CASHIER")

  const paymentData = useMemo(
    () => [
      { name: "Efectivo", value: paymentSplitMonth.cash, color: "#3b82f6" }, // blue-500
      { name: "Tarjeta", value: paymentSplitMonth.card, color: "#93c5fd" },  // blue-300
    ],
    [paymentSplitMonth]
  )

  const topSeller = sellerPerformance[0]

  const createMember = (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setError(null)

    startTransition(async () => {
      try {
        await createAdminMember({
          name: memberName,
          email: memberEmail,
          password: memberPassword,
          role: memberRole,
        })

        setMemberName("")
        setMemberEmail("")
        setMemberPassword("")
        setMemberRole("CASHIER")
        setMessage("Miembro creado correctamente")
      } catch (err) {
        const msg = err instanceof Error ? err.message : "No se pudo crear el miembro"
        setError(msg)
      }
    })
  }

  return (
    <div className="space-y-6">
      {message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-100 shadow-sm relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between pb-4">
              <p className="text-[13px] font-medium text-slate-500 uppercase tracking-wider">Ventas hoy</p>
              <div className="rounded-full bg-blue-50 p-2.5">
                <DollarSign className="h-4 w-4 text-blue-500" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-3xl font-semibold text-slate-900 tracking-tight">{formatMoney(kpis.todaySalesTotal)}</p>
              <p className="text-xs font-medium text-slate-400">{kpis.todaySalesCount} tickets en total</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between pb-4">
              <p className="text-[13px] font-medium text-slate-500 uppercase tracking-wider">Ventas mes</p>
              <div className="rounded-full bg-blue-50 p-2.5">
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-3xl font-semibold text-slate-900 tracking-tight">{formatMoney(kpis.monthSalesTotal)}</p>
              <p className="text-xs font-medium text-slate-400">{kpis.monthSalesCount} ventas registradas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between pb-4">
              <p className="text-[13px] font-medium text-slate-500 uppercase tracking-wider">Activos</p>
              <div className="rounded-full bg-blue-50 p-2.5">
                <Users className="h-4 w-4 text-blue-500" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-3xl font-semibold text-slate-900 tracking-tight">{kpis.activeSellers}</p>
              <p className="text-xs font-medium text-slate-400">cajeros en el sistema</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between pb-4">
              <p className="text-[13px] font-medium text-slate-500 uppercase tracking-wider">Gastos hoy</p>
              <div className="rounded-full bg-blue-50 p-2.5">
                <CreditCard className="h-4 w-4 text-blue-500" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-3xl font-semibold text-slate-900 tracking-tight">{formatMoney(kpis.todayExpensesTotal)}</p>
              <p className="text-xs font-medium text-slate-400">egresos del día</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="border-slate-100 shadow-sm relative overflow-hidden">
          <CardContent className="p-5">
            <p className="text-[13px] font-medium text-slate-500 uppercase tracking-wider mb-2">Gastos mes</p>
            <p className="text-2xl font-semibold text-slate-900 tracking-tight">{formatMoney(kpis.monthExpensesTotal)}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100 shadow-sm relative overflow-hidden">
          <CardContent className="p-5">
            <p className="text-[13px] font-medium text-slate-500 uppercase tracking-wider mb-2">Neto mes</p>
            <p className="text-2xl font-semibold text-slate-900 tracking-tight">{formatMoney(kpis.monthNetTotal)}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100 shadow-sm relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-slate-500 uppercase tracking-wider mb-2">Alertas inventario</p>
                <p className="text-2xl font-semibold text-slate-900 tracking-tight">{kpis.lowStockSupplies}</p>
              </div>
              <div className="rounded-full bg-red-50 p-2.5">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="members">Miembros</TabsTrigger>
          <TabsTrigger value="sellers">Rendimiento vendedores</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-slate-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-slate-800">Ventas vs gastos (últimos 14 días)</CardTitle>
                <CardDescription>Comparativo diario de ingresos y egresos.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesByDay} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} stroke="#94a3b8" fontSize={12} />
                      <YAxis tickLine={false} axisLine={false} stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${v}`} />
                      <Tooltip 
                        formatter={(value: number, name) => [formatMoney(value), name === "sales" ? "Ventas" : "Gastos"]}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
                      />
                      <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-slate-800">Método de pago (mes actual)</CardTitle>
                <CardDescription>Distribución de efectivo y tarjeta.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={paymentData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={95} paddingAngle={5} stroke="none">
                        {paymentData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [formatMoney(value), "Total"]} 
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-blue-50 bg-blue-50/50 p-4 transition-colors hover:bg-blue-50">
                    <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">Efectivo</p>
                    <p className="text-lg font-semibold text-slate-900">{formatMoney(paymentSplitMonth.cash)}</p>
                  </div>
                  <div className="rounded-lg border border-blue-100 bg-blue-100/50 p-4 transition-colors hover:bg-blue-100">
                    <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">Tarjeta</p>
                    <p className="text-lg font-semibold text-slate-900">{formatMoney(paymentSplitMonth.card)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card className="border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <CardHeader className="pl-8">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <UserPlus className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-lg text-slate-800">Registrar nuevo miembro</CardTitle>
                </div>
              </div>
              <CardDescription className="ml-11">Crear usuarios administrativos o cajeros desde este panel.</CardDescription>
            </CardHeader>
            <CardContent className="pl-8">
              <form onSubmit={createMember} className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="member-name">Nombre</Label>
                  <Input id="member-name" value={memberName} onChange={(e) => setMemberName(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="member-email">Correo</Label>
                  <Input id="member-email" type="email" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="member-password">Contrasena temporal</Label>
                  <Input
                    id="member-password"
                    type="password"
                    minLength={6}
                    value={memberPassword}
                    onChange={(e) => setMemberPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="member-role">Rol</Label>
                  <select
                    id="member-role"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value as "ADMIN" | "CASHIER")}
                  >
                    <option value="CASHIER">Cajero</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>

                <div className="lg:col-span-2 mt-2">
                  <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto px-8 transition-colors">
                    {isPending ? "Creando..." : "Crear miembro"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-sm relative pt-2">
            <CardHeader>
              <CardTitle className="text-lg text-slate-800">Miembros del sistema</CardTitle>
              <CardDescription>Visualiza y administra accesos al sistema.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Alta</TableHead>
                    <TableHead className="text-right">Accion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        <Badge variant={member.role === "ADMIN" ? "default" : "secondary"}>
                          {member.role === "ADMIN" ? "ADMIN" : "CAJERO"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(member.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <ResetPasswordDialog userId={member.id} userName={member.name} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sellers" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="border-slate-100 shadow-sm relative overflow-hidden bg-white">
              <CardContent className="p-5">
                <p className="text-[13px] font-medium text-slate-500 uppercase tracking-wider mb-2">Top vendedor (30 días)</p>
                <div className="flex flex-col">
                  <p className="truncate text-2xl font-semibold text-slate-900 tracking-tight">{topSeller?.name || "Sin datos"}</p>
                  <p className="text-sm font-medium text-blue-600 mt-1">{topSeller ? formatMoney(topSeller.revenue) : "$0.00"}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-100 shadow-sm relative overflow-hidden bg-white">
              <CardContent className="p-5">
                <p className="text-[13px] font-medium text-slate-500 uppercase tracking-wider mb-2">Ventas totales (30 días)</p>
                <div className="flex flex-col">
                  <p className="text-2xl font-semibold text-slate-900 tracking-tight">
                    {sellerPerformance.reduce((acc, item) => acc + item.salesCount, 0)}
                  </p>
                  <p className="text-sm font-medium text-slate-400 mt-1">transacciones</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-100 shadow-sm relative overflow-hidden bg-white">
              <CardContent className="p-5">
                <p className="text-[13px] font-medium text-slate-500 uppercase tracking-wider mb-2">Ingreso generado</p>
                <div className="flex flex-col">
                  <p className="text-2xl font-semibold text-slate-900 tracking-tight">
                    {formatMoney(sellerPerformance.reduce((acc, item) => acc + item.revenue, 0))}
                  </p>
                  <p className="text-sm font-medium text-slate-400 mt-1">acumulado por cajeros</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-100 shadow-sm relative pt-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <ShoppingBag className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-lg text-slate-800">Ranking de vendedores</CardTitle>
                </div>
              </div>
              <CardDescription className="ml-11">Rendimiento de los últimos 30 días.</CardDescription>
            </CardHeader>
            <CardContent>
              {sellerPerformance.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">No hay vendedores con información para este periodo.</p>
              ) : (
                <div className="space-y-2.5">
                  {sellerPerformance.map((seller, index) => (
                    <div key={seller.userId} className="group rounded-xl border border-slate-100 bg-white p-4 transition-all hover:border-blue-100 hover:shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-sm font-semibold text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{seller.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{seller.salesCount} ventas concretadas</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-blue-600">{formatMoney(seller.revenue)}</p>
                          <p className="text-[11px] font-medium text-slate-400 mt-0.5">Ticket prom: <span className="text-slate-500">{formatMoney(seller.averageTicket)}</span></p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-sm relative pt-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <CreditCard className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-lg text-slate-800">Comparativo por vendedor</CardTitle>
                </div>
              </div>
              <CardDescription className="ml-11">Ventas e ingresos por usuario.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sellerPerformance} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#94a3b8" fontSize={12} />
                    <YAxis yAxisId="left" tickLine={false} axisLine={false} stroke="#94a3b8" fontSize={12} />
                    <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${v}`} />
                    <Tooltip 
                      formatter={(value: number, name) => (name === "Ingresos" ? [formatMoney(value), name] : [value, name])} 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}  
                    />
                    <Bar yAxisId="left" dataKey="salesCount" name="Ventas" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="revenue" name="Ingresos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
