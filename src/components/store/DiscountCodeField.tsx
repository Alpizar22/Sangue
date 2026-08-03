"use client"

import { useState } from "react"

export interface AppliedDiscount {
  code: string
  type: "percentage" | "fixed"
  value: number
  discountAmount: number
}

interface CartLine {
  product_id: string
  quantity: number
  size: string
  color: string
}

export default function DiscountCodeField({
  items,
  applied,
  onApply,
  onRemove,
  disabled = false,
}: {
  items: CartLine[]
  applied: AppliedDiscount | null
  onApply: (discount: AppliedDiscount) => void
  onRemove: () => void
  disabled?: boolean
}) {
  const [code, setCode] = useState("")
  const [status, setStatus] = useState<"idle" | "loading">("idle")
  const [message, setMessage] = useState("")

  async function handleApply() {
    const trimmed = code.trim()
    if (!trimmed || status === "loading") return
    setStatus("loading")
    setMessage("")
    try {
      const response = await fetch("/api/descuentos/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed, items }),
      })
      const data = (await response.json().catch(() => null)) as
        | { valid?: boolean; message?: string; code?: string; type?: string; value?: number; discountAmount?: number }
        | null

      if (data?.valid && data.code && data.discountAmount != null) {
        onApply({
          code: data.code,
          type: data.type === "fixed" ? "fixed" : "percentage",
          value: Number(data.value ?? 0),
          discountAmount: Number(data.discountAmount),
        })
        setCode("")
        setMessage("")
        return
      }
      setMessage(data?.message ?? "No pudimos validar el código.")
    } catch {
      setMessage("No pudimos validar el código. Revisa tu conexión.")
    } finally {
      setStatus("idle")
    }
  }

  if (applied) {
    return (
      <div
        className="flex items-center justify-between gap-3 px-3 py-2.5"
        style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
      >
        <div className="min-w-0">
          <p
            className="text-[11px] uppercase tracking-[0.08em] truncate"
            style={{ fontFamily: "var(--font-inter)", fontWeight: 600, color: "var(--ink)" }}
          >
            {applied.code}
          </p>
          <p className="text-[11px]" style={{ fontFamily: "var(--font-inter)", color: "var(--text-secondary)" }}>
            {applied.type === "percentage" ? `${applied.value}% de descuento` : "Descuento aplicado"}
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="text-[11px] underline underline-offset-2 disabled:opacity-40"
          style={{ fontFamily: "var(--font-inter)", color: "var(--text-secondary)" }}
        >
          Quitar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label
        htmlFor="discount-code"
        className="block text-[11px] uppercase tracking-[0.08em]"
        style={{ fontFamily: "var(--font-inter)", fontWeight: 500, color: "var(--text-secondary)" }}
      >
        Código de descuento
      </label>
      <div className="flex gap-2">
        <input
          id="discount-code"
          name="discount_code"
          type="text"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          onKeyDown={(event) => {
            // El checkout es un form: Enter aquí debe aplicar el código, no
            // enviar el pedido a MercadoPago.
            if (event.key === "Enter") {
              event.preventDefault()
              handleApply()
            }
          }}
          placeholder="THEIA10"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={40}
          disabled={disabled || status === "loading"}
          aria-describedby={message ? "discount-code-message" : undefined}
          aria-invalid={message ? true : undefined}
          className="flex-1 min-w-0 border px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
          style={{ fontFamily: "var(--font-inter)", borderColor: "var(--border)", background: "var(--bg)" }}
        />
        <button
          type="button"
          onClick={handleApply}
          disabled={disabled || status === "loading" || !code.trim()}
          className="px-4 text-[11px] uppercase tracking-[0.1em] disabled:opacity-40"
          style={{ fontFamily: "var(--font-inter)", fontWeight: 500, background: "var(--ink)", color: "var(--bg)" }}
        >
          {status === "loading" ? "…" : "Aplicar"}
        </button>
      </div>
      {message && (
        <p
          id="discount-code-message"
          role="status"
          className="text-[11px]"
          style={{ fontFamily: "var(--font-inter)", color: "#a13a2f" }}
        >
          {message}
        </p>
      )}
    </div>
  )
}
