"use client"

import { useState, useEffect } from "react"
import { useCartStore } from "@/store/cart"
import { useRouter } from "next/navigation"
import type { ShippingAddress } from "@/types"

export default function CheckoutPage() {
  const { items, total, clearCart } = useCartStore()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    email: "", name: "", phone: "",
    street: "", number: "", floor: "", apartment: "",
    city: "", province: "", postal_code: "",
  })

  useEffect(() => {
    if (items.length === 0) router.push("/carrito")
  }, [items.length, router])

  if (items.length === 0) return null

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const shippingAddress: ShippingAddress = {
      street: form.street,
      number: form.number,
      floor: form.floor || undefined,
      apartment: form.apartment || undefined,
      city: form.city,
      province: form.province,
      postal_code: form.postal_code,
      country: "AR",
    }

    const res = await fetch("/api/pedidos/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items,
        customer: { email: form.email, name: form.name, phone: form.phone },
        shipping_address: shippingAddress,
      }),
    })

    const data = await res.json()

    if (res.ok && data.checkoutUrl) {
      clearCart()
      window.location.href = data.checkoutUrl
    } else {
      alert(data.error || "Error al procesar. Intentá nuevamente.")
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <section>
            <h2 className="font-semibold mb-3">Datos de contacto</h2>
            <div className="space-y-3">
              {[
                { name: "name", label: "Nombre completo", type: "text" },
                { name: "email", label: "Email", type: "email" },
                { name: "phone", label: "Teléfono", type: "tel" },
              ].map(({ name, label, type }) => (
                <div key={name}>
                  <label className="block text-sm font-medium mb-1">{label}</label>
                  <input
                    name={name}
                    type={type}
                    required={name !== "phone"}
                    value={form[name as keyof typeof form]}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-semibold mb-3">Dirección de envío</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Calle</label>
                  <input name="street" required value={form.street} onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Número</label>
                  <input name="number" required value={form.number} onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Piso</label>
                  <input name="floor" value={form.floor} onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Departamento</label>
                  <input name="apartment" value={form.apartment} onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Ciudad</label>
                  <input name="city" required value={form.city} onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Código Postal</label>
                  <input name="postal_code" required value={form.postal_code} onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Provincia</label>
                <input name="province" required value={form.province} onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
              </div>
            </div>
          </section>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3.5 rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Procesando..." : `Pagar $${total().toLocaleString("es-AR")} con MercadoPago`}
          </button>
        </form>

        <div className="space-y-3">
          <h2 className="font-semibold mb-3">Tu pedido</h2>
          {items.map((item) => (
            <div key={`${item.product_id}-${item.size}-${item.color}`} className="flex gap-3">
              {item.product.images?.[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.product.images[0]} alt={item.product.title}
                  className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.product.title}</p>
                <p className="text-xs text-gray-500">{item.size} · {item.color} · ×{item.quantity}</p>
              </div>
              <p className="text-sm font-semibold">${(item.product.sale_price * item.quantity).toLocaleString("es-AR")}</p>
            </div>
          ))}
          <div className="border-t pt-3 flex justify-between font-bold">
            <span>Total</span>
            <span>${total().toLocaleString("es-AR")}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
