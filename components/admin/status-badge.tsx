import { cn } from "@/lib/utils"
import type { SupplyStatus } from "@/lib/types"

interface StatusBadgeProps {
  status: SupplyStatus
}

const statusConfig: Record<SupplyStatus, { label: string; className: string }> = {
  OK: {
    label: "Disponible",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  LOW: {
    label: "Bajo",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  OUT: {
    label: "Agotado",
    className: "bg-red-100 text-red-800 border-red-200",
  },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]
  
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.className
      )}
    >
      {config.label}
    </span>
  )
}
