import type { Expense, Supply } from "@/lib/types"
import { sql } from "@/lib/db"

const WHATSAPP_API_URL = "https://graph.facebook.com/v18.0"
const WHATSAPP_MAX_RETRIES = 3

interface WhatsAppResponse {
  messaging_product: string
  contacts?: { input: string; wa_id: string }[]
  messages?: { id: string }[]
  error?: {
    message: string
    type: string
    code: number
  }
}

async function ensureWhatsAppRecipientsTable() {
  await sql(`
    CREATE TABLE IF NOT EXISTS whatsapp_recipients (
      id SERIAL PRIMARY KEY,
      phone TEXT NOT NULL UNIQUE,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}

async function getRecipientPhones(): Promise<string[]> {
  await ensureWhatsAppRecipientsTable()

  const recipients = await sql(`
    SELECT phone
    FROM whatsapp_recipients
    WHERE is_active = TRUE
    ORDER BY created_at DESC
  `) as { phone: string }[]

  return recipients.map((r) => r.phone)
}

/**
 * Send a WhatsApp message using Meta Business API
 */
export async function sendWhatsAppMessage(
  message: string,
  recipientPhone: string
): Promise<{ success: boolean; error?: string }> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

  // Check if WhatsApp is configured
  if (!phoneNumberId || !accessToken) {
    console.log("[WhatsApp] Not configured - skipping alert")
    return { success: false, error: "WhatsApp not configured" }
  }

  for (let attempt = 1; attempt <= WHATSAPP_MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(`${WHATSAPP_API_URL}/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: recipientPhone,
          type: "text",
          text: { body: message }
        })
      })

      const data: WhatsAppResponse = await response.json()

      if (response.ok && !data.error) {
        console.log("[WhatsApp] Message sent successfully:", data.messages?.[0]?.id)
        return { success: true }
      }

      const code = data.error?.code
      const isTransient = response.status === 429 || response.status >= 500 || code === 131000
      const errorMessage = data.error?.message || `HTTP ${response.status}`

      if (!isTransient || attempt === WHATSAPP_MAX_RETRIES) {
        console.error("[WhatsApp] API Error:", data.error || errorMessage)
        return { success: false, error: errorMessage }
      }

      const delayMs = 700 * attempt
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    } catch (error) {
      if (attempt === WHATSAPP_MAX_RETRIES) {
        console.error("[WhatsApp] Network error:", error)
        return { success: false, error: "Network error" }
      }

      const delayMs = 700 * attempt
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  return { success: false, error: "Unknown error" }
}

/**
 * Format inventory alert message for WhatsApp
 */
export function formatInventoryAlert(supplies: Supply[]): string {
  const outOfStock = supplies.filter(s => s.status === "OUT")
  const lowStock = supplies.filter(s => s.status === "LOW")

  const now = new Date()
  const timestamp = now.toLocaleString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  })

  let message = `*Alerta de Inventario - El Colegio Invisible*\n\n`
  message += `Los siguientes productos necesitan reabastecimiento:\n\n`

  if (outOfStock.length > 0) {
    message += `*AGOTADO:*\n`
    outOfStock.forEach(supply => {
      message += `- ${supply.name} (${supply.current_stock} ${supply.unit})\n`
    })
    message += `\n`
  }

  if (lowStock.length > 0) {
    message += `*BAJO STOCK:*\n`
    lowStock.forEach(supply => {
      message += `- ${supply.name} (${supply.current_stock} ${supply.unit})\n`
    })
    message += `\n`
  }

  message += `_Hora: ${timestamp}_`

  return message
}

/**
 * Send inventory alert via WhatsApp
 * This function handles the anti-spam logic (should be called after checking lastAlertSent)
 */
export async function sendInventoryAlert(supplies: Supply[]): Promise<{ success: boolean; error?: string }> {
  if (supplies.length === 0) {
    return { success: true }
  }

  const recipients = await getRecipientPhones()
  if (recipients.length === 0) {
    console.log("[WhatsApp] No recipients configured - skipping alert")
    return { success: false, error: "No recipients configured" }
  }

  const message = formatInventoryAlert(supplies)

  const results = await Promise.all(recipients.map((phone) => sendWhatsAppMessage(message, phone)))
  const firstError = results.find((r) => !r.success)?.error

  return {
    success: results.some((r) => r.success),
    error: firstError,
  }
}

type ExpenseNotificationPayload = Pick<Expense, "concept" | "category" | "amount" | "notes"> & {
  createdBy: string
}

export function formatExpenseAlert(expense: ExpenseNotificationPayload): string {
  const now = new Date()
  const timestamp = now.toLocaleString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

  let message = `*Nuevo Gasto Registrado - El Colegio Invisible*\n\n`
  message += `*Concepto:* ${expense.concept}\n`
  message += `*Categoria:* ${expense.category}\n`
  message += `*Monto:* $${Number(expense.amount).toFixed(2)}\n`
  message += `*Registrado por:* ${expense.createdBy}\n`

  if (expense.notes?.trim()) {
    message += `*Notas:* ${expense.notes.trim()}\n`
  }

  message += `\n_Hora: ${timestamp}_`
  return message
}

export async function sendExpenseAlert(
  expense: ExpenseNotificationPayload
): Promise<{ success: boolean; error?: string }> {
  const recipients = await getRecipientPhones()
  if (recipients.length === 0) {
    console.log("[WhatsApp] No recipients configured - skipping expense alert")
    return { success: false, error: "No recipients configured" }
  }

  const message = formatExpenseAlert(expense)
  const results = await Promise.all(recipients.map((phone) => sendWhatsAppMessage(message, phone)))
  const firstError = results.find((r) => !r.success)?.error

  return {
    success: results.some((r) => r.success),
    error: firstError,
  }
}
