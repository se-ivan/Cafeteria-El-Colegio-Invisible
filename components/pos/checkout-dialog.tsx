"use client"

import { useState } from "react"
import EscPosEncoder from 'esc-pos-encoder'
import { useSession } from "next-auth/react"
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
  onConfirm: (paymentMethod: PaymentMethod, notes?: string) => Promise<{
    saleId: number
    total: number
    lowStockCount: number
    createdAt: Date
  }>
}

type ReceiptData = {
  saleId: number
  total: number
  createdAt: Date
  paymentMethod: PaymentMethod
  items: CartItem[]
  notes?: string
  cashierName: string
}

function buildEscPosTicket(data: ReceiptData): string[] {
  const subtotalNoIva = data.total / 1.16
  const iva = data.total - subtotalNoIva
  const fecha = new Date(data.createdAt).toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
  const ticketCode = String(data.saleId).padStart(6, "0")
  const line = "--------------------------------\n"

  const rows = data.items.map((item) => {
    const itemTotal = (item.product.price * item.quantity).toFixed(2)
    const namePart = item.product.name.substring(0, 16).padEnd(16, " ")
    const qtyPart = String(item.quantity).padStart(4, " ")
    const pricePart = `$${itemTotal}`.padStart(12, " ")
    return `${namePart}${qtyPart}${pricePart}\n`
  })

  return [
    "\x1B\x40", // Initialize printer
    "\x1B\x61\x01", // Center
    "\x1D\x21\x00", // Normal size
    "\x1B\x45\x01", // Bold on
    "LIBRERIA Y CAFETERIA\n",
    "\x1B\x45\x00", // Bold off
    "\x1D\x21\x00", // Normal size
    "LIBROS Y MAS\n",
    "RFC: XAXX010101000\n",
    "Av. Principal #123\n",
    "Sucursal Margarita\n",
    "Tel: 443-000-0000\n",
    line,
    "\x1B\x61\x00", // Left
    `Fecha: ${fecha}\n`,
    `Cajero: ${data.cashierName}\n`,
    `Ticket: ${ticketCode}\n`,
    line,
    "Producto           Cant  Total\n",
    line,
    ...rows,
    line,
    "\x1B\x61\x02", // Right
    `SUBTOTAL: $${subtotalNoIva.toFixed(2)}\n`,
    `IVA 16%: $${iva.toFixed(2)}\n`,
    "\x1B\x45\x01", // Bold on
    `TOTAL: $${data.total.toFixed(2)}\n`,
    "\x1B\x45\x00", // Bold off
    "\x1B\x61\x01", // Center
    line,
    `Codigo: ${ticketCode}\n`,
    "Escanea para promociones\n",
    "https://elcolegioinvisible.com/\n",
    "\n",
    "GRACIAS POR SU COMPRA\n",
    "VUELVA PRONTO\n",
    "\n\n\n",
    "\x1D\x56\x00", // Full cut
  ]
}

export function CheckoutDialog({ open, onOpenChange, items, onConfirm }: CheckoutDialogProps) {
  const { data: session } = useSession()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [notes, setNotes] = useState("")
  const [cashReceived, setCashReceived] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)

  const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  const cashReceivedNumber = parseFloat(cashReceived || "0")
  const change = paymentMethod === "CASH" ? cashReceivedNumber - total : 0
  const isInsufficientCash = paymentMethod === "CASH" && cashReceived !== "" && cashReceivedNumber < total

  const parseUsbId = (raw: string, fallback: number) => {
    const value = raw?.trim()
    if (!value) return fallback
    if (value.toLowerCase().startsWith("0x")) {
      return Number.parseInt(value, 16)
    }
    if (/^[0-9]+$/.test(value)) {
      // Many USB IDs are configured as 4 hex digits (e.g. 0483) without 0x prefix.
      // Interpret that shape as hex to avoid mismatches when filtering devices.
      if (value.length === 4 && value.startsWith("0")) {
        return Number.parseInt(value, 16)
      }
      return Number.parseInt(value, 10)
    }
    return Number.parseInt(value, 16)
  }

  const imprimirConQzTray = async () => {
    if (!receiptData) return false

    const qz = (window as any).qz
    if (!qz) return false

    if (qz.security?.setCertificatePromise) {
      qz.security.setCertificatePromise((resolve: (cert?: string) => void) => resolve())
    }
    if (qz.security?.setSignaturePromise) {
      qz.security.setSignaturePromise(() => (resolve: (signature?: string) => void) => resolve())
    }

    if (!qz.websocket.isActive()) {
      await qz.websocket.connect({ retries: 1, delay: 0 })
    }

    const preferredPrinter = process.env.NEXT_PUBLIC_QZ_PRINTER_NAME?.trim()
    let printerName: string | undefined

    if (preferredPrinter) {
      const found = await qz.printers.find(preferredPrinter)
      printerName = Array.isArray(found) ? found[0] : found
    } else {
      const found = await qz.printers.find()
      printerName = Array.isArray(found) ? found[0] : found
    }

    if (!printerName) {
      throw new Error("No se encontro impresora para QZ Tray")
    }

    const config = qz.configs.create(printerName, {
      encoding: "Cp1252",
      copies: 1,
    })
    const data = buildEscPosTicket(receiptData)

    await qz.print(config, data)
    return true
  }

  const imprimirTicket = async () => {
    if (!receiptData) return

    try {
      const printed = await imprimirConQzTray()
      if (printed) {
        return
      }
    } catch (qzError) {
      console.error("QZ Tray no disponible, usando WebUSB como respaldo:", qzError)
    }

    try {
      const vendorId = parseUsbId(process.env.NEXT_PUBLIC_PRINTER_VENDOR_ID || "0x04b8", 0x04b8)
      const productId = parseUsbId(process.env.NEXT_PUBLIC_PRINTER_PRODUCT_ID || "", Number.NaN)
      const usb = (navigator as any).usb
      const filters = Number.isNaN(productId) ? [{ vendorId }] : [{ vendorId, productId }]

      const grantedDevices = await usb.getDevices()
      let device = grantedDevices.find((d: any) =>
        d.vendorId === vendorId && (Number.isNaN(productId) || d.productId === productId)
      )

      if (!device) {
        device = await usb.requestDevice({ filters })
      }

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
      const maxLogoWidth = 160
      if (imgWidth > maxLogoWidth) {
        imgHeight = Math.floor((imgHeight * maxLogoWidth) / imgWidth)
        imgWidth = maxLogoWidth
      }
      imgWidth = Math.floor(imgWidth / 8) * 8
      imgHeight = Math.floor(imgHeight / 8) * 8
      if (imgWidth === 0) imgWidth = 8
      if (imgHeight === 0) imgHeight = 8

      let encoder = new EscPosEncoder()
      const subtotalNoIva = receiptData.total / 1.16
      const iva = receiptData.total - subtotalNoIva
      const fecha = new Date(receiptData.createdAt).toLocaleString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
      const ticketCode = String(receiptData.saleId).padStart(6, "0")
      const barcodeValue = String(receiptData.saleId).padStart(12, "0")

      encoder = encoder
        .initialize()
        .codepage('windows1252')
        .align('center')
        .image(img, imgWidth, imgHeight, 'threshold')
        .bold(true)
        .line('LIBRERIA Y CAFETERIA')
        .bold(false)
        .newline()
        .line('LIBROS Y MAS')
        .line('RFC: XAXX010101000')
        .line('Av. Principal #123')
        .line('Sucursal Margarita')
        .line('Tel: 443-000-0000')
        .line('--------------------------------')
        .align('left')
        .line(`Fecha: ${fecha}`)
        .line(`Cajero: ${receiptData.cashierName}`)
        .line(`Ticket: ${ticketCode}`)
        .line('--------------------------------')
        .line('Producto           Cant  Total')
        .line('--------------------------------')

      receiptData.items.forEach(item => {
        const itemTotal = (item.product.price * item.quantity).toFixed(2)
        const namePart = item.product.name.substring(0, 16).padEnd(16, ' ')
        const qtyPart = String(item.quantity).padStart(4, ' ')
        const pricePart = `$${itemTotal}`.padStart(12, ' ')
        encoder.line(`${namePart}${qtyPart}${pricePart}`)
      })

      encoder
        .line('--------------------------------')
        .align('right')
        .line(`SUBTOTAL: $${subtotalNoIva.toFixed(2)}`)
        .line(`IVA 16%: $${iva.toFixed(2)}`)
        .bold(true)
        .line(`TOTAL: $${receiptData.total.toFixed(2)}`)
        .bold(false)
        .align('center')
        .line('--------------------------------')
        .line('Codigo de ticket')
        .barcode(barcodeValue, 'ean13', 64)
        .newline()
        .line('Escanea para promociones')
        .qrcode('https://elcolegioinvisible.com/', 2, 6, 'm')
        .newline()
        .line('¡Gracias por tu compra!')
        .line('VUELVA PRONTO')
        .newline()
        .newline()
        .newline()
        .newline()
        .cut()

      const result = encoder.encode()
      await device.transferOut(device.configuration!.interfaces[0].alternate.endpoints.find((e: any) => e.direction === "out")!.endpointNumber, result)
      await device.close()
    } catch (err) {
      console.error("Error imprimiendo:", err)
      if (err instanceof DOMException && err.name === "NotFoundError") {
        alert(
          "No se encontro una impresora USB compatible para seleccionar.\n\n"
        )
        return
      }
      if (err instanceof DOMException && err.name === "SecurityError") {
        alert(
          "El navegador no pudo abrir la impresora USB (Access denied).\n\n" +
          "En Windows esto suele pasar cuando la impresora está usando el driver de impresión normal y no WinUSB para WebUSB.\n" +
          "1) Desconecta/reconecta la impresora\n" +
          "2) En chrome://settings/content/usbDevices elimina permisos del sitio y vuelve a autorizar\n" +
          "3) Si sigue igual, esta impresora no puede usarse por WebUSB con su driver actual y se necesita un puente local (QZ Tray) o cambiar driver a WinUSB."
        )
        return
      }
      alert("Hubo un error al imprimir el ticket. Asegúrate de que la impresora esté permitida y conectada.")
    }
  }

  const handleConfirm = async () => {
    if (!paymentMethod) return

    setIsProcessing(true)
    try {
      const result = await onConfirm(paymentMethod, notes || undefined)
      setReceiptData({
        saleId: result.saleId,
        total: result.total,
        createdAt: result.createdAt,
        paymentMethod,
        items: items.map((item) => ({ ...item })),
        notes: notes || undefined,
        cashierName: session?.user?.name || session?.user?.email || "Cajero",
      })
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
      setReceiptData(null)
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
