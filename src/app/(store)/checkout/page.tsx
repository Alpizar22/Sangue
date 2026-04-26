"use client"

import { useState, useEffect, useRef } from "react"
import { useCartStore } from "@/store/cart"
import { useRouter } from "next/navigation"

interface FormState {
  first_name: string
  last_name: string
  email: string
  phone: string
  street: string
  ext_number: string
  int_number: string
  colonia: string
  postal_code: string
  city: string
  state: string
}

interface FormErrors {
  [key: string]: string
}

interface CPData {
  municipio: string
  estado: string
  ciudad: string
  colonias: string[]
}

const FIELD_STYLE = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black transition-shadow"
const ERROR_STYLE = "w-full border border-red-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-red-50 transition-shadow"

function fieldClass(err?: string) {
  return err ? ERROR_STYLE : FIELD_STYLE
}

function Field({
  name, label, type = "text", required = true, placeholder = "",
  value, error, onChange, inputMode, autoComplete = "off", autoCapitalize = "off",
}: {
  name: keyof FormState
  label: string
  type?: string
  required?: boolean
  placeholder?: string
  value: string
  error?: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
  autoComplete?: string
  autoCapitalize?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        data-error={!!error || undefined}
        className={fieldClass(error)}
        inputMode={inputMode}
        autoComplete={autoComplete}
        autoCapitalize={autoCapitalize}
        autoCorrect="off"
        spellCheck={false}
      />
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  )
}

const SHIPPING_COST = 155

export default function CheckoutPage() {
  const { items, total, clearCart } = useCartStore()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [cpLoading, setCpLoading] = useState(false)
  const [colonias, setColonias] = useState<string[]>([])
  const cpTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [coloniaInput, setColoniaInput] = useState("")

  const [form, setForm] = useState<FormState>({
    first_name: "", last_name: "", email: "", phone: "",
    street: "", ext_number: "", int_number: "",
    colonia: "", postal_code: "", city: "", state: "",
  })

  useEffect(() => {
    if (items.length === 0) router.push("/carrito")
  }, [items.length, router])

  if (items.length === 0) return null

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target

    if (name === "postal_code") {
      const v = value.replace(/\D/g, "").slice(0, 5)
      setForm(f => ({ ...f, postal_code: v }))
      if (errors.postal_code) setErrors(er => ({ ...er, postal_code: "" }))
      if (cpTimer.current) clearTimeout(cpTimer.current)
      if (v.length === 5) {
        cpTimer.current = setTimeout(() => lookupCP(v), 400)
      } else {
        setColonias([])
        setColoniaInput("")
        setForm(f => ({ ...f, city: "", state: "", colonia: "" }))
      }
      return
    }

    setForm(f => ({ ...f, [name]: value }))
    if (errors[name]) setErrors(er => ({ ...er, [name]: "" }))
  }

  async function lookupCP(cp: string) {
    setCpLoading(true)
    try {
      const res = await fetch(`/api/cp?cp=${cp}`)
      if (!res.ok) {
        setErrors(er => ({ ...er, postal_code: "CP no encontrado" }))
        return
      }
      const data: CPData = await res.json()
      setForm(f => ({ ...f, city: data.ciudad || data.municipio, state: data.estado, colonia: "" }))
      setColonias(data.colonias ?? [])
      setColoniaInput("")
      setErrors(er => ({ ...er, postal_code: "" }))
    } catch {
      // If CP lookup fails, let user type manually — not a hard error
    } finally {
      setCpLoading(false)
    }
  }

  function validate(): FormErrors {
    const e: FormErrors = {}
    if (!form.first_name.trim()) e.first_name = "Requerido"
    if (!form.last_name.trim()) e.last_name = "Requerido"
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Email inválido"
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, "")))
      e.phone = "Teléfono: 10 dígitos"
    if (!form.street.trim()) e.street = "Requerido"
    if (!form.ext_number.trim()) e.ext_number = "Requerido"
    const coloniaFinal = form.colonia === "__otra__" ? coloniaInput : form.colonia
    if (!coloniaFinal.trim()) e.colonia = "Requerido"
    if (!/^\d{5}$/.test(form.postal_code)) e.postal_code = "5 dígitos"
    if (!form.city.trim()) e.city = "Requerido"
    if (!form.state.trim()) e.state = "Requerido"
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      const firstEl = document.querySelector<HTMLElement>("[data-error='true']")
      firstEl?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }

    setLoading(true)

    const res = await fetch("/api/pedidos/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items,
        customer: {
          email: form.email.toLowerCase().trim(),
          name: `${form.first_name.trim()} ${form.last_name.trim()}`,
          phone: form.phone.replace(/\D/g, ""),
        },
        shipping_address: {
          street: form.street.trim(),
          number: form.ext_number.trim(),
          floor: form.int_number || undefined,
          colonia: (form.colonia === "__otra__" ? coloniaInput : form.colonia).trim(),
          city: form.city.trim(),
          province: form.state.trim(),
          postal_code: form.postal_code,
          country: "MX",
        },
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

  const inputClass = (name: keyof FormState) => fieldClass(errors[name])

  return (
    <div style={{ background: "var(--bg)", minHeight: "60vh" }}>
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <h1
          className="text-2xl md:text-3xl italic mb-8"
          style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)" }}
        >
          Finalizar compra
        </h1>

        <div className="grid md:grid-cols-[1fr_380px] gap-8 items-start">
          {/* ── FORM ─────────────────────────────────────── */}
          <form onSubmit={handleSubmit} noValidate className="space-y-7">

            {/* Datos de contacto */}
            <section
              className="rounded-xl p-5 space-y-4"
              style={{ background: "var(--paper)", border: "1px solid rgba(26,26,26,0.08)" }}
            >
              <h2
                className="text-[10px] uppercase tracking-[0.2em]"
                style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.5 }}
              >
                Datos de contacto
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <Field name="first_name" label="Nombre" placeholder="María" value={form.first_name} error={errors.first_name} onChange={handleChange} autoComplete="given-name" autoCapitalize="words" />
                <Field name="last_name" label="Apellido" placeholder="García" value={form.last_name} error={errors.last_name} onChange={handleChange} autoComplete="family-name" autoCapitalize="words" />
              </div>
              <Field name="email" label="Email" type="email" placeholder="maria@correo.com" value={form.email} error={errors.email} onChange={handleChange} autoComplete="email" />
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Teléfono<span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 10)
                    setForm(f => ({ ...f, phone: v }))
                    if (errors.phone) setErrors(er => ({ ...er, phone: "" }))
                  }}
                  placeholder="10 dígitos"
                  maxLength={10}
                  className={inputClass("phone")}
                />
                {errors.phone && <p className="text-xs text-red-500 mt-0.5">{errors.phone}</p>}
              </div>
            </section>

            {/* Dirección de envío */}
            <section
              className="rounded-xl p-5 space-y-4"
              style={{ background: "var(--paper)", border: "1px solid rgba(26,26,26,0.08)" }}
            >
              <h2
                className="text-[10px] uppercase tracking-[0.2em]"
                style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.5 }}
              >
                Dirección de envío
              </h2>

              {/* CP con autocomplete */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Código Postal<span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="relative">
                  <input
                    name="postal_code"
                    type="text"
                    inputMode="numeric"
                    value={form.postal_code}
                    onChange={handleChange}
                    placeholder="12345"
                    maxLength={5}
                    className={inputClass("postal_code")}
                  />
                  {cpLoading && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                      Buscando…
                    </span>
                  )}
                </div>
                {errors.postal_code && <p className="text-xs text-red-500 mt-0.5">{errors.postal_code}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Ciudad<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="Auto-completado"
                    className={inputClass("city")}
                  />
                  {errors.city && <p className="text-xs text-red-500 mt-0.5">{errors.city}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Estado<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    placeholder="Auto-completado"
                    className={inputClass("state")}
                  />
                  {errors.state && <p className="text-xs text-red-500 mt-0.5">{errors.state}</p>}
                </div>
              </div>

              {/* Colonia — ambos elementos siempre en DOM, toggle con CSS */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Colonia<span className="text-red-500 ml-0.5">*</span>
                </label>
                <select
                  name="colonia"
                  value={form.colonia}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === "__otra__") {
                      setColoniaInput("")
                      setForm(f => ({ ...f, colonia: "__otra__" }))
                    } else {
                      setColoniaInput("")
                      setForm(f => ({ ...f, colonia: v }))
                      if (errors.colonia) setErrors(er => ({ ...er, colonia: "" }))
                    }
                  }}
                  className={`${inputClass("colonia")}${colonias.length === 0 || form.colonia === "__otra__" ? " hidden" : ""}`}
                  tabIndex={colonias.length === 0 || form.colonia === "__otra__" ? -1 : undefined}
                >
                  <option value="">— Selecciona colonia —</option>
                  {colonias.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="__otra__">Otra (escribir manualmente)</option>
                </select>
                {/* Input visible cuando no hay colonias (sin CP) O cuando usuario eligió "Otra" */}
                <input
                  name="colonia"
                  value={colonias.length === 0 ? form.colonia : coloniaInput}
                  onChange={(e) => {
                    const v = e.target.value
                    if (colonias.length === 0) {
                      setForm(f => ({ ...f, colonia: v }))
                      if (errors.colonia) setErrors(er => ({ ...er, colonia: "" }))
                    } else {
                      setColoniaInput(v)
                      if (errors.colonia) setErrors(er => ({ ...er, colonia: "" }))
                    }
                  }}
                  placeholder={form.colonia === "__otra__" ? "Escribe tu colonia" : "Nombre de tu colonia"}
                  className={`${inputClass("colonia")}${colonias.length > 0 && form.colonia !== "__otra__" ? " hidden" : ""}`}
                  tabIndex={colonias.length > 0 && form.colonia !== "__otra__" ? -1 : undefined}
                />
                {errors.colonia && <p className="text-xs text-red-500 mt-0.5">{errors.colonia}</p>}
              </div>

              <Field name="street" label="Calle" placeholder="Av. Juárez" value={form.street} error={errors.street} onChange={handleChange} autoComplete="street-address" autoCapitalize="words" />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Número exterior<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    name="ext_number"
                    type="text"
                    value={form.ext_number}
                    onChange={handleChange}
                    placeholder="123"
                    className={inputClass("ext_number")}
                  />
                  {errors.ext_number && <p className="text-xs text-red-500 mt-0.5">{errors.ext_number}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Número interior
                  </label>
                  <input
                    name="int_number"
                    type="text"
                    value={form.int_number}
                    onChange={handleChange}
                    placeholder="Depto. 4B"
                    className={inputClass("int_number")}
                  />
                  {errors.int_number && <p className="text-xs text-red-500 mt-0.5">{errors.int_number}</p>}
                </div>
              </div>
            </section>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 text-[11px] uppercase tracking-[0.2em] transition-all duration-300 disabled:opacity-50"
              style={{
                fontFamily: "var(--font-space-mono)",
                background: "var(--ink)",
                color: "var(--bg)",
              }}
            >
              {loading ? "Procesando…" : `Pagar $${(total() + SHIPPING_COST).toLocaleString("es-MX")} MXN con MercadoPago`}
            </button>
          </form>

          {/* ── RESUMEN ──────────────────────────────────── */}
          <div
            className="rounded-xl p-5 space-y-4 sticky top-4"
            style={{ background: "var(--paper)", border: "1px solid rgba(26,26,26,0.08)" }}
          >
            <h2
              className="text-[10px] uppercase tracking-[0.2em]"
              style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.5 }}
            >
              Tu pedido
            </h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={`${item.product_id}-${item.size}-${item.color}`} className="flex gap-3">
                  {item.product.images?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.product.images[0]}
                      alt={item.product.title}
                      className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-medium leading-snug line-clamp-2"
                      style={{ color: "var(--ink)" }}
                    >
                      {item.product.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--ink)", opacity: 0.5 }}>
                      {[item.size, item.color].filter(Boolean).join(" · ")} · ×{item.quantity}
                    </p>
                  </div>
                  <p
                    className="text-sm font-semibold whitespace-nowrap"
                    style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)" }}
                  >
                    ${(item.product.sale_price * item.quantity).toLocaleString("es-MX")}
                  </p>
                </div>
              ))}
            </div>
            <div
              className="space-y-2 pt-3"
              style={{ borderTop: "1px solid rgba(26,26,26,0.1)" }}
            >
              <div
                className="flex justify-between text-[12px]"
                style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)" }}
              >
                <span style={{ opacity: 0.5 }}>Subtotal</span>
                <span>${total().toLocaleString("es-MX")}</span>
              </div>
              <div
                className="flex justify-between text-[12px]"
                style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)" }}
              >
                <span style={{ opacity: 0.5 }}>Envío estándar</span>
                <span>${SHIPPING_COST.toLocaleString("es-MX")}</span>
              </div>
              <div
                className="flex justify-between items-center pt-2"
                style={{ borderTop: "1px solid rgba(26,26,26,0.07)" }}
              >
                <span
                  className="text-[10px] uppercase tracking-[0.2em]"
                  style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.5 }}
                >
                  Total
                </span>
                <span
                  className="text-lg font-semibold"
                  style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)" }}
                >
                  ${(total() + SHIPPING_COST).toLocaleString("es-MX")}
                </span>
              </div>
            </div>
            <p
              className="text-[10px] text-center"
              style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.35 }}
            >
              Pago seguro con MercadoPago · 15–25 días hábiles
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
