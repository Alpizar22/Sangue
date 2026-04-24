"use client"

import { useCartStore } from "@/store/cart"
import Link from "next/link"
import { Trash2 } from "lucide-react"

const SHIPPING_COST = 155

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCartStore()

  if (items.length === 0) {
    return (
      <div style={{ background: "var(--bg)", minHeight: "60vh" }}>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1
            className="text-2xl italic mb-3"
            style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)" }}
          >
            Tu carrito está vacío
          </h1>
          <p
            className="text-[11px] uppercase tracking-[0.2em] mb-8"
            style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.35 }}
          >
            Aún no has agregado ningún producto
          </p>
          <Link
            href="/coleccion"
            className="inline-block px-8 py-3 text-[11px] uppercase tracking-[0.2em] transition-opacity hover:opacity-80"
            style={{ fontFamily: "var(--font-space-mono)", background: "var(--ink)", color: "var(--bg)" }}
          >
            Ver colección
          </Link>
        </div>
      </div>
    )
  }

  const subtotal = total()
  const grandTotal = subtotal + SHIPPING_COST

  return (
    <div style={{ background: "var(--bg)", minHeight: "60vh" }}>
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">

        <h1
          className="text-2xl md:text-3xl italic mb-8"
          style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)" }}
        >
          Tu carrito
        </h1>

        <div className="grid md:grid-cols-[1fr_320px] gap-8 items-start">

          {/* Items */}
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={`${item.product_id}-${item.size}-${item.color}`}
                className="flex gap-4 p-4"
                style={{ border: "1px solid rgba(26,26,26,0.08)", background: "var(--paper)" }}
              >
                {item.product.images?.[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.product.images[0]}
                    alt={item.product.title}
                    className="w-20 h-20 object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[12px] font-medium leading-snug mb-0.5"
                    style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)" }}
                  >
                    {item.product.title}
                  </p>
                  <p
                    className="text-[11px] mb-3"
                    style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.45 }}
                  >
                    {[item.size && `Talla: ${item.size}`, item.color && `Color: ${item.color}`].filter(Boolean).join(" · ")}
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(item.product_id, item.size, item.color, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center transition-opacity hover:opacity-70"
                      style={{ border: "1px solid rgba(26,26,26,0.2)", fontFamily: "var(--font-space-mono)", color: "var(--ink)" }}
                    >
                      −
                    </button>
                    <span
                      className="w-6 text-center text-[12px]"
                      style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)" }}
                    >
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product_id, item.size, item.color, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center transition-opacity hover:opacity-70"
                      style={{ border: "1px solid rgba(26,26,26,0.2)", fontFamily: "var(--font-space-mono)", color: "var(--ink)" }}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex flex-col justify-between items-end">
                  <button
                    onClick={() => removeItem(item.product_id, item.size, item.color)}
                    className="transition-opacity hover:opacity-60"
                    style={{ color: "var(--ink)", opacity: 0.3 }}
                    aria-label="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                  <p
                    className="text-[13px] font-medium"
                    style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)" }}
                  >
                    ${(item.product.sale_price * item.quantity).toLocaleString("es-MX")}
                  </p>
                </div>
              </div>
            ))}

            <button
              onClick={clearCart}
              className="text-[10px] uppercase tracking-[0.15em] transition-opacity hover:opacity-60"
              style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.3 }}
            >
              Vaciar carrito
            </button>
          </div>

          {/* Resumen */}
          <div
            className="p-5 space-y-4 sticky top-4"
            style={{ border: "1px solid rgba(26,26,26,0.08)", background: "var(--paper)" }}
          >
            <h2
              className="text-[10px] uppercase tracking-[0.2em]"
              style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.4 }}
            >
              Resumen
            </h2>

            <div className="space-y-2">
              <div className="flex justify-between text-[12px]" style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)" }}>
                <span style={{ opacity: 0.55 }}>Subtotal</span>
                <span>${subtotal.toLocaleString("es-MX")}</span>
              </div>
              <div className="flex justify-between text-[12px]" style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)" }}>
                <span style={{ opacity: 0.55 }}>Envío estándar</span>
                <span>${SHIPPING_COST.toLocaleString("es-MX")}</span>
              </div>
            </div>

            <div
              className="flex justify-between pt-3"
              style={{ borderTop: "1px solid rgba(26,26,26,0.1)", fontFamily: "var(--font-space-mono)", color: "var(--ink)" }}
            >
              <span
                className="text-[10px] uppercase tracking-[0.2em]"
                style={{ opacity: 0.5 }}
              >
                Total
              </span>
              <span className="text-lg font-semibold">
                ${grandTotal.toLocaleString("es-MX")}
              </span>
            </div>

            <Link
              href="/checkout"
              className="block w-full py-3.5 text-center text-[11px] uppercase tracking-[0.2em] transition-opacity hover:opacity-80"
              style={{ fontFamily: "var(--font-space-mono)", background: "var(--ink)", color: "var(--bg)" }}
            >
              Comprar ahora
            </Link>

            <p
              className="text-[10px] text-center"
              style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.3 }}
            >
              Pago seguro con MercadoPago
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
