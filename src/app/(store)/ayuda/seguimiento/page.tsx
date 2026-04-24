import { createClient } from "@/lib/supabase/server"
import type { Metadata } from "next"
import type { Order } from "@/types"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Rastrea tu pedido — Theia",
  description: "Consulta el estado de tu pedido Theia con tu número de orden.",
}

const STATUS_STEPS: { key: Order["status"] | "paid"; label: string; desc: string }[] = [
  { key: "pending",               label: "Pedido recibido",     desc: "Tu pedido fue registrado exitosamente." },
  { key: "paid",                  label: "Pago confirmado",     desc: "MercadoPago confirmó tu pago." },
  { key: "processing",            label: "En preparación",      desc: "Estamos procesando tu pedido." },
  { key: "ordered_to_supplier",   label: "Pedido a proveedor",  desc: "Tu pedido fue enviado a nuestro proveedor." },
  { key: "shipped",               label: "En camino",           desc: "Tu paquete está en tránsito." },
  { key: "delivered",             label: "Entregado",           desc: "¡Tu pedido llegó a su destino!" },
]

const STATUS_ORDER: Order["status"][] = [
  "pending", "paid", "processing", "ordered_to_supplier", "shipped", "delivered"
]

function stepIndex(status: Order["status"]): number {
  return STATUS_ORDER.indexOf(status)
}

type SearchParams = Promise<{ orden?: string }>

export default async function SeguimientoPage({ searchParams }: { searchParams: SearchParams }) {
  const { orden } = await searchParams
  const supabase = await createClient()

  let order: Order | null = null
  let notFound = false

  if (orden?.trim()) {
    const q = orden.trim()
    // Try by ID first, then by MercadoPago payment ID
    const { data: byId } = await supabase
      .from("orders")
      .select("*, customer(*), items:order_items(*)")
      .eq("id", q)
      .maybeSingle()

    if (byId) {
      order = byId as Order
    } else {
      const { data: byPayment } = await supabase
        .from("orders")
        .select("*, customer(*), items:order_items(*)")
        .eq("mercadopago_payment_id", q)
        .maybeSingle()
      order = (byPayment as Order) ?? null
      if (!order) notFound = true
    }
  }

  const currentStep = order ? stepIndex(order.status) : -1

  return (
    <div style={{ background: "var(--bg)", minHeight: "60vh" }}>
      <div className="max-w-2xl mx-auto px-4 py-12 md:py-16">

        <h1
          className="text-3xl italic mb-2"
          style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)" }}
        >
          Rastrea tu pedido
        </h1>
        <p
          className="text-[11px] uppercase tracking-[0.2em] mb-10"
          style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.35 }}
        >
          Ingresa tu número de orden para consultar el estado
        </p>

        {/* Search form */}
        <form method="GET" className="flex gap-2 mb-10">
          <input
            type="text"
            name="orden"
            defaultValue={orden ?? ""}
            placeholder="Número de orden o ID de pago"
            className="flex-1 px-4 py-3 text-[12px] focus:outline-none"
            style={{
              fontFamily: "var(--font-space-mono)",
              border: "1px solid rgba(26,26,26,0.2)",
              background: "var(--bg)",
              color: "var(--ink)",
            }}
          />
          <button
            type="submit"
            className="px-6 py-3 text-[11px] uppercase tracking-[0.15em] transition-opacity hover:opacity-80"
            style={{
              fontFamily: "var(--font-space-mono)",
              background: "var(--ink)",
              color: "var(--bg)",
            }}
          >
            Buscar
          </button>
        </form>

        {/* Not found */}
        {notFound && (
          <div
            className="p-5 mb-8 text-[12px]"
            style={{
              border: "1px solid rgba(214,48,49,0.3)",
              background: "rgba(214,48,49,0.05)",
              fontFamily: "var(--font-space-mono)",
              color: "#d63031",
            }}
          >
            No encontramos ningún pedido con ese número. Verifica el dato e intenta de nuevo.
            Puedes encontrarlo en el email de confirmación que te enviamos.
          </div>
        )}

        {/* Order found */}
        {order && (
          <div className="space-y-8">

            {/* Status stepper */}
            <div>
              <p
                className="text-[9px] uppercase tracking-[0.25em] mb-6"
                style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.35 }}
              >
                Estado actual
              </p>
              <div className="space-y-0">
                {STATUS_STEPS.map((step, i) => {
                  const done = currentStep >= i
                  const active = currentStep === i
                  const cancelled = order!.status === "cancelled"
                  return (
                    <div key={step.key} className="flex gap-4">
                      {/* Line + dot */}
                      <div className="flex flex-col items-center">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0 mt-1 transition-all"
                          style={{
                            background: cancelled
                              ? "rgba(26,26,26,0.15)"
                              : done
                              ? "var(--ink)"
                              : "rgba(26,26,26,0.15)",
                            border: active ? "2px solid var(--bg)" : "none",
                            boxShadow: active ? "0 0 0 2px var(--ink)" : "none",
                          }}
                        />
                        {i < STATUS_STEPS.length - 1 && (
                          <div
                            className="w-px flex-1 my-1"
                            style={{
                              background: done && currentStep > i ? "var(--ink)" : "rgba(26,26,26,0.1)",
                              minHeight: "24px",
                            }}
                          />
                        )}
                      </div>
                      {/* Text */}
                      <div className="pb-5">
                        <p
                          className="text-[12px]"
                          style={{
                            fontFamily: "var(--font-space-mono)",
                            color: "var(--ink)",
                            fontWeight: active ? "600" : "400",
                            opacity: done ? 1 : 0.3,
                          }}
                        >
                          {step.label}
                        </p>
                        {active && (
                          <p
                            className="text-[11px] mt-0.5"
                            style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.55 }}
                          >
                            {step.desc}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
                {order.status === "cancelled" && (
                  <p
                    className="text-[12px] mt-2"
                    style={{ fontFamily: "var(--font-space-mono)", color: "#d63031" }}
                  >
                    Este pedido fue cancelado.
                  </p>
                )}
              </div>
            </div>

            {/* Tracking */}
            {order.tracking_number && (
              <div
                className="p-4 space-y-2"
                style={{ border: "1px solid rgba(26,26,26,0.08)", background: "var(--paper)" }}
              >
                <p
                  className="text-[9px] uppercase tracking-[0.25em]"
                  style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.35 }}
                >
                  Número de guía
                </p>
                <p
                  className="text-[13px] font-medium"
                  style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)" }}
                >
                  {order.tracking_number}
                </p>
                <a
                  href={`https://t.17track.net/es#nums=${order.tracking_number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
                  style={{
                    fontFamily: "var(--font-space-mono)",
                    color: "var(--bg)",
                    background: "var(--ink)",
                    padding: "6px 16px",
                    marginTop: "4px",
                  }}
                >
                  Rastrear en 17track →
                </a>
              </div>
            )}

            {/* Order summary */}
            <div style={{ borderTop: "1px solid rgba(26,26,26,0.08)" }} className="pt-6 space-y-2">
              <p
                className="text-[9px] uppercase tracking-[0.25em] mb-4"
                style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.35 }}
              >
                Resumen
              </p>
              <div className="flex justify-between text-[12px]" style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)" }}>
                <span style={{ opacity: 0.5 }}>Total pagado</span>
                <span>${Number(order.total).toLocaleString("es-MX")} MXN</span>
              </div>
              {order.shipping_address && (
                <div className="flex justify-between text-[12px]" style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)" }}>
                  <span style={{ opacity: 0.5 }}>Destino</span>
                  <span style={{ opacity: 0.75 }}>
                    {order.shipping_address.city}, {order.shipping_address.province}
                  </span>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Help prompt */}
        {!order && !notFound && (
          <div
            className="p-5 text-[12px] space-y-2"
            style={{
              border: "1px solid rgba(26,26,26,0.08)",
              background: "var(--paper)",
              fontFamily: "var(--font-space-mono)",
            }}
          >
            <p style={{ color: "var(--ink)", opacity: 0.65 }}>
              ¿No encuentras tu número de orden? Revisa el email de confirmación que
              te enviamos al momento de pagar.
            </p>
            <p style={{ color: "var(--ink)", opacity: 0.65 }}>
              Si aún tienes dudas, escríbenos:{" "}
              <a
                href="https://wa.me/5213312345678"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--accent-2)", textDecoration: "underline" }}
              >
                WhatsApp
              </a>
              {" o "}
              <a href="mailto:hola@theia.lat" style={{ color: "var(--accent-2)", textDecoration: "underline" }}>
                hola@theia.lat
              </a>
            </p>
          </div>
        )}

        <div className="mt-10">
          <Link
            href="/coleccion"
            className="text-[10px] uppercase tracking-[0.2em] transition-opacity hover:opacity-60"
            style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.35 }}
          >
            ← Seguir comprando
          </Link>
        </div>
      </div>
    </div>
  )
}
