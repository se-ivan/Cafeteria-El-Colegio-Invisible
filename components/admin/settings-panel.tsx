"use client"

import { useMemo, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { addAlertRecipient, createWorker, removeAlertRecipient, removeWorker } from "@/lib/actions"
import type { UserRole, WhatsAppRecipient, WorkerUser } from "@/lib/types"
import { Bell, Trash2, UserPlus, Users } from "lucide-react"

type SettingsPanelProps = {
  workers: WorkerUser[]
  recipients: WhatsAppRecipient[]
  currentUserId: number
}

const DOMAIN = "@elcolegioinvisible.com"

export function SettingsPanel({ workers, recipients, currentUserId }: SettingsPanelProps) {
  const [isPending, startTransition] = useTransition()

  const [workerName, setWorkerName] = useState("")
  const [workerEmailUser, setWorkerEmailUser] = useState("")
  const [workerPassword, setWorkerPassword] = useState("")
  const [workerRole, setWorkerRole] = useState<UserRole>("CASHIER")

  const [recipientPhone, setRecipientPhone] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const workersCount = useMemo(() => workers.length, [workers.length])
  const recipientsCount = useMemo(() => recipients.length, [recipients.length])

  const clearFeedback = () => {
    setMessage(null)
    setError(null)
  }

  const handleCreateWorker = (e: React.FormEvent) => {
    e.preventDefault()
    clearFeedback()

    startTransition(async () => {
      try {
        await createWorker({
          name: workerName,
          emailLocalPart: workerEmailUser,
          password: workerPassword,
          role: workerRole,
        })

        setWorkerName("")
        setWorkerEmailUser("")
        setWorkerPassword("")
        setWorkerRole("CASHIER")
        setMessage("Trabajador creado correctamente")
      } catch (err) {
        const text = err instanceof Error ? err.message : "No se pudo crear el trabajador"
        setError(text)
      }
    })
  }

  const handleRemoveWorker = (workerId: number) => {
    clearFeedback()

    startTransition(async () => {
      try {
        await removeWorker(workerId)
        setMessage("Trabajador eliminado")
      } catch (err) {
        const text = err instanceof Error ? err.message : "No se pudo eliminar el trabajador"
        setError(text)
      }
    })
  }

  const handleAddRecipient = (e: React.FormEvent) => {
    e.preventDefault()
    clearFeedback()

    startTransition(async () => {
      try {
        await addAlertRecipient(recipientPhone)
        setRecipientPhone("")
        setMessage("Numero agregado a alertas")
      } catch (err) {
        const text = err instanceof Error ? err.message : "No se pudo agregar el numero"
        setError(text)
      }
    })
  }

  const handleRemoveRecipient = (recipientId: number) => {
    clearFeedback()

    startTransition(async () => {
      try {
        await removeAlertRecipient(recipientId)
        setMessage("Numero eliminado de alertas")
      } catch (err) {
        const text = err instanceof Error ? err.message : "No se pudo eliminar el numero"
        setError(text)
      }
    })
  }

  return (
    <div className="space-y-6">
      {message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-stone-500">Trabajadores registrados</p>
            <p className="text-3xl font-bold text-stone-900">{workersCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-stone-500">Numeros para alertas</p>
            <p className="text-3xl font-bold text-stone-900">{recipientsCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-cyan-600" />
            <CardTitle>Alta de trabajadores</CardTitle>
          </div>
          <CardDescription>
            Todos los correos se crean con el dominio fijo {DOMAIN}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateWorker} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="worker-name">Nombre completo</Label>
                <Input
                  id="worker-name"
                  value={workerName}
                  onChange={(e) => setWorkerName(e.target.value)}
                  placeholder="Ej. Ana Lopez"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="worker-email-user">Usuario de correo</Label>
                <div className="flex items-center rounded-md border border-input bg-background">
                  <Input
                    id="worker-email-user"
                    className="border-0 shadow-none focus-visible:ring-0"
                    value={workerEmailUser}
                    onChange={(e) => setWorkerEmailUser(e.target.value)}
                    placeholder="ana.lopez"
                    required
                  />
                  <span className="pr-3 text-xs text-stone-500">{DOMAIN}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="worker-password">Contrasena temporal</Label>
                <Input
                  id="worker-password"
                  type="password"
                  value={workerPassword}
                  onChange={(e) => setWorkerPassword(e.target.value)}
                  placeholder="Minimo 6 caracteres"
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label>Rol</Label>
                <Select value={workerRole} onValueChange={(value: UserRole) => setWorkerRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASHIER">Cajero</SelectItem>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" disabled={isPending} className="bg-cyan-600 hover:bg-cyan-700">
              {isPending ? "Guardando..." : "Crear trabajador"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-stone-700" />
            <CardTitle>Trabajadores activos</CardTitle>
          </div>
          <CardDescription>
            Elimina usuarios que ya no tengan acceso al sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {workers.length === 0 ? (
            <p className="text-sm text-stone-500">No hay trabajadores registrados.</p>
          ) : (
            workers.map((worker) => (
              <div key={worker.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="font-medium text-stone-900">{worker.name}</p>
                  <p className="text-sm text-stone-500">{worker.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={worker.role === "ADMIN" ? "default" : "secondary"}>
                    {worker.role === "ADMIN" ? "ADMIN" : "CAJERO"}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isPending || worker.id === currentUserId}
                    onClick={() => handleRemoveWorker(worker.id)}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    title={worker.id === currentUserId ? "No puedes eliminar tu propio usuario" : "Eliminar"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-600" />
            <CardTitle>Numeros para alertas de WhatsApp</CardTitle>
          </div>
          <CardDescription>
            Agrega o elimina los numeros que recibiran alertas de inventario.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAddRecipient} className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="+521234567890"
              required
            />
            <Button type="submit" disabled={isPending} className="bg-amber-600 hover:bg-amber-700">
              {isPending ? "Guardando..." : "Agregar numero"}
            </Button>
          </form>

          <div className="space-y-2">
            {recipients.length === 0 ? (
              <p className="text-sm text-stone-500">No hay numeros configurados.</p>
            ) : (
              recipients.map((recipient) => (
                <div key={recipient.id} className="flex items-center justify-between rounded-lg border p-3">
                  <p className="font-medium text-stone-900">{recipient.phone}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isPending}
                    onClick={() => handleRemoveRecipient(recipient.id)}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
