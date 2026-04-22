"use client"

import { useCartStore } from "@/store/cart"
import Link from "next/link"
import { Trash2 } from "lucide-react"

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Tu carrito está vacío</h1>
        <Link
          href="/productos"
          className="inline-block bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800"
        >
          Ver productos
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Carrito</h1>

      <div className="space-y-4 mb-8">
        {items.map((item) => (
          <div
            key={`${item.product_id}-${item.size}-${item.color}`}
            className="flex gap-4 p-4 border rounded-xl"
          >
            {item.product.images?.[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.product.images[0]}
                alt={item.product.title}
                className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{item.product.title}</p>
              <p className="text-sm text-gray-500">
                {item.size && `Talle: ${item.size}`}
                {item.size && item.color && " · "}
                {item.color && `Color: ${item.color}`}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => updateQuantity(item.product_id, item.size, item.color, item.quantity - 1)}
                  className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-gray-100"
                >
                  −
                </button>
                <span className="w-6 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.product_id, item.size, item.color, item.quantity + 1)}
                  className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>
            <div className="text-right flex flex-col justify-between">
              <button
                onClick={() => removeItem(item.product_id, item.size, item.color)}
                className="text-gray-400 hover:text-red-500 self-end"
              >
                <Trash2 size={18} />
              </button>
              <p className="font-bold">
                ${(item.product.sale_price * item.quantity).toLocaleString("es-AR")}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t pt-6 flex flex-col items-end gap-4">
        <div className="text-xl font-bold">
          Total: ${total().toLocaleString("es-AR")}
        </div>
        <div className="flex gap-3">
          <button
            onClick={clearCart}
            className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
          >
            Vaciar
          </button>
          <Link
            href="/checkout"
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            Comprar ahora
          </Link>
        </div>
      </div>
    </div>
  )
}
