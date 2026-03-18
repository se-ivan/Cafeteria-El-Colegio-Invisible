"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { POSHeader } from "@/components/pos/pos-header"
import { ProductGrid } from "@/components/pos/product-grid"
import { Cart } from "@/components/pos/cart"
import { CheckoutDialog } from "@/components/pos/checkout-dialog"
import { processSale } from "@/lib/actions"
import type { Category, Product, CartItem, PaymentMethod } from "@/lib/types"

interface POSClientProps {
  categories: Category[]
  products: Product[]
  todaySales: { total: number; count: number }
}

export function POSClient({ categories, products, todaySales }: POSClientProps) {
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
    await processSale(cart, paymentMethod, notes)
    setCart([])
    router.refresh()
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <POSHeader todaySales={todaySales} />

      <div className="flex-1 flex overflow-hidden">
        {/* Product Grid */}
        <div className="flex-1 p-6 overflow-hidden">
          <ProductGrid
            categories={categories}
            products={products}
            onAddToCart={addToCart}
          />
        </div>

        {/* Cart */}
        <div className="w-[400px] flex-shrink-0">
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
