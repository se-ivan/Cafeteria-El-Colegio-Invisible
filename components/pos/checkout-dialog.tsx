"use client"

import { useState } from "react"
import EscPosEncoder from 'esc-pos-encoder'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Banknote, CreditCard, Check } from "lucide-react"
import type { CartItem, PaymentMethod } from "@/lib/types"

interface CheckoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: CartItem[]
  onConfirm: (paymentMethod: PaymentMethod, notes?: string) => Promise<void>
}

export function CheckoutDialog({ open, onOpenChange, items, onConfirm }: CheckoutDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [notes, setNotes] = useState("")
  const [cashReceived, setCashReceived] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [success, setSuccess] = useState(false)

  const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  const cashReceivedNumber = parseFloat(cashReceived || "0")
  const change = paymentMethod === "CASH" ? cashReceivedNumber - total : 0
  const isInsufficientCash = paymentMethod === "CASH" && cashReceived !== "" && cashReceivedNumber < total

  const imprimirTicket = async () => {
    try {
      const vendorIdHex = process.env.NEXT_PUBLIC_PRINTER_VENDOR_ID || "0x04b8"
      const vendorId = parseInt(vendorIdHex, 16)
      
      const device = await (navigator as any).usb.requestDevice({ filters: [{ vendorId }] })
      await device.open()
      await device.selectConfiguration(1)
      await device.claimInterface(0)

      const img = new window.Image()
      img.src = '/logo_negro.png'
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      let imgWidth = img.width
      let imgHeight = img.height
      if (imgWidth > 256) {
        imgHeight = Math.floor((imgHeight * 256) / imgWidth)
        imgWidth = 256
      }
      imgWidth = Math.floor(imgWidth / 8) * 8
      imgHeight = Math.floor(imgHeight / 8) * 8
      if (imgWidth === 0) imgWidth = 8
      if (imgHeight === 0) imgHeight = 8

      let encoder = new EscPosEncoder()
      encoder = encoder
        .initialize()
        .codepage('windows1252')
        .align('center')
        .image(img, imgWidth, imgHeight, 'threshold')
        .newline()
        .bold(true)
        .line('Cafetería El Colegio Invisible')
        .bold(false)
        .line('--------------------------------')

      items.forEach(item => {
        const itemTotal = (item.product.price * item.quantity).toFixed(2)
        const namePart = item.product.name.padEnd(20, ' ').substring(0, 20)
        const pricePart = `$${itemTotal}`.padStart(10, ' ')
        encoder.line(`${item.quantity}x ${namePart} ${pricePart}`)
      })

      encoder
        .line('--------------------------------')
        .align('right')
        .line(`Total: $${total.toFixed(2)}`)
        .align('center')
        .line('--------------------------------')
        .line('¡Gracias por tu compra!')
        .newline()
        .newline()
        .cut()

      const result = encoder.encode()
      await device.transferOut(device.configuration!.interfaces[0].alternate.endpoints.find((e: any) => e.direction === "out")!.endpointNumber, result)
      await device.close()
    } catch (err) {
      console.error("Error imprimiendo:", err)
      alert("Hubo un error al imprimir el ticket. Asegúrate de que la impresora esté permitida y conectada.")
    }
  }

  const handleConfirm = async () => {
    if (!paymentMethod) return

    setIsProcessing(true)
    try {
      await onConfirm(paymentMethod, notes || undefined)
      setSuccess(true)
    } catch (error) {
      console.error("Checkout error:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    if (!isProcessing) {
      setSuccess(false)
      setPaymentMethod(null)
      setNotes("")
      setCashReceived("")
      onOpenChange(false)
    }
  }

  if (success) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Venta completada</h3>
            <p className="text-gray-500 mt-1">Total: ${total.toFixed(2)}</p>
            {paymentMethod === "CASH" && (
              <p className="text-emerald-600 font-medium mt-2">
                Cambio: ${Math.max(change, 0).toFixed(2)}
              </p>
            )}
            
            <div className="flex gap-3 mt-8 w-full">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={imprimirTicket}
              >
                Imprimir Ticket
              </Button>
              <Button 
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                onClick={handleClose}
              >
                Nueva Venta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Confirmar Venta</DialogTitle>
          <DialogDescription>
            Selecciona el metodo de pago para completar la venta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-gray-500">Total a cobrar</p>
            <p className="text-3xl font-bold text-gray-900">${total.toFixed(2)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant={paymentMethod === "CASH" ? "default" : "outline"}
              className={`h-20 flex flex-col gap-2 rounded-xl ${paymentMethod === "CASH" ? "bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/25" : "border-gray-200"}`}
              onClick={() => setPaymentMethod("CASH")}
            >
              <Banknote className="h-6 w-6" />
              <span>Efectivo</span>
            </Button>
            <Button
              type="button"
              variant={paymentMethod === "CARD" ? "default" : "outline"}
              className={`h-20 flex flex-col gap-2 rounded-xl ${paymentMethod === "CARD" ? "bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/25" : "border-gray-200"}`}
              onClick={() => setPaymentMethod("CARD")}
            >
              <CreditCard className="h-6 w-6" />
              <span>Tarjeta</span>
            </Button>
          </div>

          {paymentMethod === "CASH" ? (
            <div className="space-y-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
              <Label htmlFor="cashReceived" className="text-gray-700">Monto recibido</Label>
              <Input
                id="cashReceived"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                className="border-emerald-200 bg-white focus:border-emerald-500"
              />
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Cambio</span>
                <span className={isInsufficientCash ? "font-semibold text-red-600" : "font-semibold text-emerald-700"}>
                  ${Math.max(change, 0).toFixed(2)}
                </span>
              </div>
              {isInsufficientCash ? (
                <p className="text-xs text-red-600">El monto recibido es menor al total.</p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-gray-700">Notas (opcional)</Label>
            <Input
              id="notes"
              placeholder="Notas adicionales..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="border-gray-200 focus:border-blue-500"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isProcessing} className="border-gray-200">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!paymentMethod || isProcessing || isInsufficientCash}
            className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25"
          >
            {isProcessing ? (
              <>
                <Spinner className="mr-2" />
                Procesando...
              </>
            ) : (
              "Confirmar Venta"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
