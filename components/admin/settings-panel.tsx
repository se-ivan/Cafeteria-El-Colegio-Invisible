"use client"

import { useMemo, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  addAlertRecipient,
  createWorker,
  removeAlertRecipient,
  removeWorker,
  updateWorkerAccess,
} from "@/lib/actions"
import { PERMISSION_CATALOG, permissionsForRole } from "@/lib/permissions"
import type { AppPermission, UserRole, WhatsAppRecipient, WorkerUser } from "@/lib/types"
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
  const [workerPermissions, setWorkerPermissions] = useState<AppPermission[]>(permissionsForRole("CASHIER"))

  const [accessDraft, setAccessDraft] = useState<Record<number, { role: UserRole; permissions: AppPermission[] }>>(
    () =>
      Object.fromEntries(
        workers.map((worker) => [
          worker.id,
          {
            role: worker.role,
            permissions: permissionsForRole(worker.role, worker.permissions),
          },
        ])
      )
  )

  const [recipientPhone, setRecipientPhone] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [workerToDelete, setWorkerToDelete] = useState<number | null>(null)
  const [recipientToDelete, setRecipientToDelete] = useState<string | null>(null)

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
          permissions: workerPermissions,
        })

        setWorkerName("")
        setWorkerEmailUser("")
        setWorkerPassword("")
        setWorkerRole("CASHIER")
        setWorkerPermissions(permissionsForRole("CASHIER"))
        setMessage("Trabajador creado correctamente")
      } catch (err) {
        const text = err instanceof Error ? err.message : "No se pudo crear el trabajador"
        setError(text)
      }
    })
  }

  const handleRemoveWorker = (workerId: number) => {
    setWorkerToDelete(workerId)
  }

  const confirmRemoveWorker = () => {
    if (workerToDelete === null) return
    clearFeedback()

    startTransition(async () => {
      try {
        await removeWorker(workerToDelete)
        setMessage("Trabajador eliminado")
      } catch (err) {
        const text = err instanceof Error ? err.message : "No se pudo eliminar el trabajador"
        setError(text)
      } finally {
        setWorkerToDelete(null)
      }
    })
  }

  const setDraftRole = (workerId: number, role: UserRole) => {
    setAccessDraft((prev) => ({
      ...prev,
      [workerId]: {
        role,
        permissions: permissionsForRole(role, prev[workerId]?.permissions || []),
      },
    }))
  }

  const toggleDraftPermission = (workerId: number, permission: AppPermission) => {
    setAccessDraft((prev) => {
      const current = prev[workerId]
      if (!current || current.role === "ADMIN") return prev

      const exists = current.permissions.includes(permission)
      const nextPermissions = exists
        ? current.permissions.filter((item) => item !== permission)
        : [...current.permissions, permission]

      return {
        ...prev,
        [workerId]: {
          ...current,
          permissions: nextPermissions,
        },
      }
    })
  }

  const handleUpdateWorkerAccess = (workerId: number) => {
    clearFeedback()
    const draft = accessDraft[workerId]
    if (!draft) return

    startTransition(async () => {
      try {
        await updateWorkerAccess(workerId, {
          role: draft.role,
          permissions: draft.permissions,
        })
        setMessage("Acceso actualizado")
      } catch (err) {
        const text = err instanceof Error ? err.message : "No se pudo actualizar acceso"
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
    setRecipientToDelete(recipientId.toString())
  }

  const confirmRemoveRecipient = () => {
    if (recipientToDelete === null) return
    clearFeedback()

    startTransition(async () => {
      try {
        await removeAlertRecipient(parseInt(recipientToDelete, 10))
        setMessage("Numero eliminado de alertas")
      } catch (err) {
        const text = err instanceof Error ? err.message : "No se pudo eliminar el numero"
        setError(text)
      } finally {
        setRecipientToDelete(null)
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
        <Card className="rounded-xl shadow-sm border-slate-100">
          <CardContent className="p-5">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Trabajadores registrados</p>
            <p className="text-3xl font-bold text-slate-900">{workersCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm border-slate-100">
          <CardContent className="p-5">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Numeros para alertas</p>
            <p className="text-3xl font-bold text-slate-900">{recipientsCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl shadow-sm border-slate-100">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <UserPlus className="h-5 w-5 text-blue-500" />
            </div>
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
                  <span className="pr-3 text-xs text-slate-500">{DOMAIN}</span>
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
                <Select
                  value={workerRole}
                  onValueChange={(value: UserRole) => {
                    setWorkerRole(value)
                    setWorkerPermissions(permissionsForRole(value, workerPermissions))
                  }}
                >
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

            <div className="space-y-3">
              <Label>Permisos</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {PERMISSION_CATALOG.map((permission) => {
                  const selected = workerRole === "ADMIN" || workerPermissions.includes(permission.id)
                  return (
                    <button
                      key={permission.id}
                      type="button"
                      disabled={workerRole === "ADMIN"}
                      onClick={() => {
                        if (workerRole === "ADMIN") return
                        setWorkerPermissions((prev) => {
                          const hasItem = prev.includes(permission.id)
                          return hasItem
                            ? prev.filter((item) => item !== permission.id)
                            : [...prev, permission.id]
                        })
                      }}
                      className={`rounded-xl border px-3 py-2 text-left transition-colors ${
                        selected
                          ? "border-blue-200 bg-blue-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      } ${workerRole === "ADMIN" ? "opacity-70 cursor-not-allowed" : ""}`}
                    >
                      <p className="text-sm font-medium text-slate-800">{permission.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{permission.description}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              {isPending ? "Guardando..." : "Crear trabajador"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm border-slate-100">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Users className="h-5 w-5 text-slate-700" />
            </div>
            <CardTitle>Trabajadores activos</CardTitle>
          </div>
          <CardDescription>
            Elimina usuarios que ya no tengan acceso al sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {workers.length === 0 ? (
            <p className="text-sm text-slate-500">No hay trabajadores registrados.</p>
          ) : (
            workers.map((worker) => (
              <div key={worker.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="space-y-2">
                  <p className="font-medium text-slate-900">{worker.name}</p>
                  <p className="text-sm text-slate-500">{worker.email}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(accessDraft[worker.id]?.permissions || []).map((permission) => (
                      <Badge key={permission} variant="secondary" className="text-[11px]">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="w-full rounded-xl border border-slate-100 bg-slate-50/50 p-3 space-y-3 lg:w-104">
                  <div className="flex items-center gap-2">
                    <Select
                      value={accessDraft[worker.id]?.role || worker.role}
                      onValueChange={(value: UserRole) => setDraftRole(worker.id, value)}
                    >
                      <SelectTrigger className="w-40 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASHIER">Cajero</SelectItem>
                        <SelectItem value="ADMIN">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isPending || worker.id === currentUserId}
                      onClick={() => handleUpdateWorkerAccess(worker.id)}
                    >
                      Guardar acceso
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {PERMISSION_CATALOG.map((permission) => {
                      const draft = accessDraft[worker.id]
                      const selected = draft?.role === "ADMIN" || draft?.permissions.includes(permission.id)
                      return (
                        <button
                          key={`${worker.id}-${permission.id}`}
                          type="button"
                          disabled={isPending || worker.id === currentUserId || draft?.role === "ADMIN"}
                          onClick={() => toggleDraftPermission(worker.id, permission.id)}
                          className={`rounded-lg border px-2.5 py-2 text-left text-xs transition-colors ${
                            selected
                              ? "border-blue-200 bg-blue-50 text-blue-700"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {permission.label}
                        </button>
                      )
                    })}
                  </div>
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
                    className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg"
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

      <Card className="rounded-xl shadow-sm border-slate-100">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Bell className="h-5 w-5 text-amber-500" />
            </div>
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
            <Button type="submit" disabled={isPending} className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm">
              {isPending ? "Guardando..." : "Agregar numero"}
            </Button>
          </form>

          <div className="space-y-3">
            {recipients.length === 0 ? (
              <p className="text-sm text-slate-500">No hay numeros configurados.</p>
            ) : (
              recipients.map((recipient) => (
                <div key={recipient.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                  <p className="font-medium text-slate-900">{recipient.phone}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isPending}
                    onClick={() => handleRemoveRecipient(recipient.id)}
                    className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={workerToDelete !== null} onOpenChange={(open) => !open && setWorkerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar trabajador?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar este trabajador? Perderá el acceso al sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveWorker} className="bg-red-500 hover:bg-red-600 text-white">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={recipientToDelete !== null} onOpenChange={(open) => !open && setRecipientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar número?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar este número de las alertas de WhatsApp?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveRecipient} className="bg-red-500 hover:bg-red-600 text-white">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
