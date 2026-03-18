import type { Supply } from "@/lib/types"

const WHATSAPP_API_URL = "https://graph.facebook.com/v18.0"

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

/**
 * Send a WhatsApp message using Meta Business API
 */
export async function sendWhatsAppMessage(message: string): Promise<{ success: boolean; error?: string }> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  const recipientPhone = process.env.WHATSAPP_RECIPIENT_PHONE

  // Check if WhatsApp is configured
  if (!phoneNumberId || !accessToken || !recipientPhone) {
    console.log("[WhatsApp] Not configured - skipping alert")
    return { success: false, error: "WhatsApp not configured" }
  }

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

    if (data.error) {
      console.error("[WhatsApp] API Error:", data.error)
      return { success: false, error: data.error.message }
    }

    console.log("[WhatsApp] Message sent successfully:", data.messages?.[0]?.id)
    return { success: true }
  } catch (error) {
    console.error("[WhatsApp] Network error:", error)
    return { success: false, error: "Network error" }
  }
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

  const message = formatInventoryAlert(supplies)
  return sendWhatsAppMessage(message)
}
