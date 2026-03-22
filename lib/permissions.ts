import type { AppPermission, SessionUser, UserRole } from "@/lib/types"

export const PERMISSION_IDS = {
  ADMIN_DASHBOARD: "ADMIN_DASHBOARD",
  INVENTORY_MANAGE: "INVENTORY_MANAGE",
  PRODUCTS_MANAGE: "PRODUCTS_MANAGE",
  SALES_VIEW: "SALES_VIEW",
  EXPENSES_MANAGE: "EXPENSES_MANAGE",
  REPORTS_VIEW: "REPORTS_VIEW",
  SETTINGS_MANAGE: "SETTINGS_MANAGE",
  POS_ACCESS: "POS_ACCESS",
  CASH_SESSION_EXPORT: "CASH_SESSION_EXPORT",
} as const

export const PERMISSION_CATALOG: ReadonlyArray<{ id: AppPermission; label: string; description: string }> = [
  {
    id: PERMISSION_IDS.ADMIN_DASHBOARD,
    label: "Dashboard",
    description: "Ver KPIs y panel administrativo",
  },
  {
    id: PERMISSION_IDS.INVENTORY_MANAGE,
    label: "Inventario",
    description: "Gestionar insumos y stock",
  },
  {
    id: PERMISSION_IDS.PRODUCTS_MANAGE,
    label: "Productos",
    description: "Crear y editar menu y recetas",
  },
  {
    id: PERMISSION_IDS.SALES_VIEW,
    label: "Ventas",
    description: "Consultar historial de ventas",
  },
  {
    id: PERMISSION_IDS.EXPENSES_MANAGE,
    label: "Gastos",
    description: "Registrar y consultar egresos",
  },
  {
    id: PERMISSION_IDS.REPORTS_VIEW,
    label: "Reportes",
    description: "Descargar reportes CSV",
  },
  {
    id: PERMISSION_IDS.SETTINGS_MANAGE,
    label: "Configuracion",
    description: "Gestion de usuarios y alertas",
  },
  {
    id: PERMISSION_IDS.POS_ACCESS,
    label: "POS",
    description: "Acceso al punto de venta",
  },
  {
    id: PERMISSION_IDS.CASH_SESSION_EXPORT,
    label: "Exportar corte",
    description: "Exportar corte de caja en CSV",
  },
]

export const ADMIN_PANEL_PERMISSIONS: AppPermission[] = [
  PERMISSION_IDS.ADMIN_DASHBOARD,
  PERMISSION_IDS.INVENTORY_MANAGE,
  PERMISSION_IDS.PRODUCTS_MANAGE,
  PERMISSION_IDS.SALES_VIEW,
  PERMISSION_IDS.EXPENSES_MANAGE,
  PERMISSION_IDS.REPORTS_VIEW,
  PERMISSION_IDS.SETTINGS_MANAGE,
]

export const ALL_PERMISSIONS = PERMISSION_CATALOG.map((item) => item.id)

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, AppPermission[]> = {
  ADMIN: ALL_PERMISSIONS,
  CASHIER: [PERMISSION_IDS.POS_ACCESS, PERMISSION_IDS.CASH_SESSION_EXPORT],
}

export function sanitizePermissions(input: unknown): AppPermission[] {
  if (!Array.isArray(input)) return []
  const safeSet = new Set(ALL_PERMISSIONS)
  const values = input.filter((value): value is AppPermission => typeof value === "string" && safeSet.has(value as AppPermission))
  return [...new Set(values)]
}

export function permissionsForRole(role: UserRole, selected?: AppPermission[]): AppPermission[] {
  if (role === "ADMIN") return [...ALL_PERMISSIONS]
  if (selected && selected.length > 0) return sanitizePermissions(selected)
  return [...DEFAULT_ROLE_PERMISSIONS.CASHIER]
}

export function hasPermission(user: Pick<SessionUser, "role" | "permissions"> | null | undefined, permission: AppPermission): boolean {
  if (!user) return false
  if (user.role === "ADMIN") return true
  return sanitizePermissions(user.permissions).includes(permission)
}

export function hasAnyPermission(user: Pick<SessionUser, "role" | "permissions"> | null | undefined, permissions: AppPermission[]): boolean {
  return permissions.some((permission) => hasPermission(user, permission))
}

export function canAccessAdminArea(user: Pick<SessionUser, "role" | "permissions"> | null | undefined): boolean {
  return hasAnyPermission(user, ADMIN_PANEL_PERMISSIONS)
}
