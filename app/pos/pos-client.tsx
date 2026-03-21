"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { POSHeader } from "@/components/pos/pos-header"
import { ProductGrid } from "@/components/pos/product-grid"
import { Cart } from "@/components/pos/cart"
import { CheckoutDialog } from "@/components/pos/checkout-dialog"
import { POSAlerts } from "@/components/pos/pos-alerts"
import { processSale } from "@/lib/actions"
import { toast } from "sonner"
import type {
  Category,
  Product,
  CartItem,
  PaymentMethod,
  Supply,
  CashSession,
  CashWithdrawal,
} from "@/lib/types"

interface POSClientProps {
  categories: Category[]
  products: Product[]
  todaySales: { total: number; count: number }
  salesBreakdown: { cashTotal: number; cardTotal: number; tickets: number }
  lowStockSupplies: Supply[]
  canManageInventory: boolean
  openCashSession: CashSession | null
  cashSessionSummary: {
    cashSalesTotal: number
    cardSalesTotal: number
    expensesTotal: number
    withdrawalsTotal: number
    expectedCash: number
  } | null
  cashWithdrawals: CashWithdrawal[]
}

export function POSClient({
  categories,
  products,
  todaySales,
  salesBreakdown,
  lowStockSupplies,
  canManageInventory,
  openCashSession,
  cashSessionSummary,
  cashWithdrawals,
}: POSClientProps) {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity < 1) {
      removeItem(productId)
      return
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    )
  }

  const removeItem = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId))
  }

  const clearCart = () => {
    setCart([])
  }

  const handleCheckout = async (paymentMethod: PaymentMethod, notes?: string) => {
    try {
      const result = await processSale(cart, paymentMethod, notes)
      setCart([])
      setIsCheckoutOpen(false)

      toast.success("Venta registrada", {
        description: `Ticket #${result.saleId} generado por $${result.total.toFixed(2)}`,
      })

      if (result.lowStockCount > 0) {
        toast.warning("Inventario con alerta", {
          description: `${result.lowStockCount} insumos requieren reabastecimiento`,
        })
      }

      router.refresh()
    } catch (error) {
      console.error("Checkout error:", error)
      const description = error instanceof Error
        ? error.message
        : "Revisa la conexion y vuelve a intentar."
      toast.error("No se pudo completar la venta", {
        description,
      })
      throw error
    }
  }

  return (
    <div className="flex h-dvh flex-col bg-gray-50">
      <POSHeader
        todaySales={todaySales}
        salesBreakdown={salesBreakdown}
        canManageInventory={canManageInventory}
        openCashSession={openCashSession}
        cashSessionSummary={cashSessionSummary}
        cashWithdrawals={cashWithdrawals}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Product Grid */}
        <div className="min-h-0 flex-1 overflow-hidden p-3 sm:p-4 lg:p-6">
          <POSAlerts lowStockSupplies={lowStockSupplies} />
          <ProductGrid
            categories={categories}
            products={products}
            onAddToCart={addToCart}
          />
        </div>

        {/* Cart */}
        <div className="max-h-[48vh] border-t border-gray-100 lg:max-h-none lg:w-100 lg:shrink-0 lg:border-t-0 lg:border-l">
          <Cart
            items={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            onCheckout={() => setIsCheckoutOpen(true)}
            onClear={clearCart}
          />
        </div>
      </div>

      {/* Checkout Dialog */}
      <CheckoutDialog
        open={isCheckoutOpen}
        onOpenChange={setIsCheckoutOpen}
        items={cart}
        onConfirm={handleCheckout}
      />
    </div>
  )
}
