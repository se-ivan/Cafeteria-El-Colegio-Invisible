"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react"
import type { CartItem } from "@/lib/types"

interface CartProps {
  items: CartItem[]
  onUpdateQuantity: (productId: number, quantity: number) => void
  onRemoveItem: (productId: number) => void
  onCheckout: () => void
  onClear: () => void
}

export function Cart({ items, onUpdateQuantity, onRemoveItem, onCheckout, onClear }: CartProps) {
  const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-100">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <ShoppingCart className="h-4 w-4 text-blue-500" />
            </div>
            <h2 className="font-semibold text-gray-900">Carrito</h2>
          </div>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{itemCount} items</span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-3">
              <ShoppingCart className="h-8 w-8 opacity-50" />
            </div>
            <p className="text-sm">Carrito vacio</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {items.map((item) => (
              <div key={item.product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-800 truncate">{item.product.name}</p>
                  <p className="text-xs text-gray-500">${item.product.price} c/u</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                    className="h-7 w-7 rounded-lg border-gray-200"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center font-semibold text-gray-800">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                    className="h-7 w-7 rounded-lg border-gray-200"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveItem(item.product.id)}
                    className="h-7 w-7 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <p className="w-16 text-right font-semibold text-gray-800">
                  ${(item.product.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-5 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between mb-5">
          <span className="text-gray-600">Total</span>
          <span className="text-3xl font-bold text-gray-900">${total.toFixed(2)}</span>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClear}
            disabled={items.length === 0}
            className="flex-1 h-12 rounded-xl border-gray-200"
          >
            Limpiar
          </Button>
          <Button
            onClick={onCheckout}
            disabled={items.length === 0}
            className="flex-1 h-12 rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25"
          >
            Cobrar
          </Button>
        </div>
      </div>
    </div>
  )
}
