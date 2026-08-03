import type { Metadata } from "next"
import Link from "next/link"
import { createServiceClient } from "@/lib/supabase/service"
import type { OrderStatus } from "@/types"

export const metadata: Metadata = {
  title: "Rastrea tu pedido — Theia",
  description: "Consulta el estado de tu pedido Theia con tu referencia segura.",
}

const STATUS_STEPS: Array<{ key: OrderStatus; label: string; description: string }> = [
  { key: "pending", label: "Pedido registrado", description: "El pago todavía no aparece como aprobado." },
  { key: "paid", label: "Pago confirmado", description: "MercadoPago confirmó tu pago." },
  { key: "processing", label: "En preparación", description: "Estamos verificando y preparando tu pedido." },
  { key: "ordered_to_supplier", label: "En producción", description: "La pieza está en proceso de producción." },
  { key: "shipped", label: "En camino", description: "Tu paquete está en tránsito." },
  { key: "delivered", label: "Entregado", description: "El pedido llegó a su destino." },
]

const STATUS_ORDER = STATUS_STEPS.map((step) => step.key)

export default async function TrackingPage({ searchParams }: { searchParams: Promise<{ referencia?: string }> }) {
  const { referencia = "" } = await searchParams
  const validReference = /^[a-f0-9]{64}$/i.test(referencia.trim())
  const { data: order } = validReference
    ? await createServiceClient()
        .from("orders")
        .select("id, status, total, shipping_address, tracking_number")
        .eq("public_access_token", referencia.trim())
        .maybeSingle()
    : { data: null }
  const currentIndex = order ? STATUS_ORDER.indexOf(order.status as OrderStatus) : -1
  const address = order?.shipping_address as { city?: string; province?: string } | undefined

  return (
    <main className="min-h-[60vh] bg-[var(--bg)]">
      <div className="mx-auto max-w-2xl px-4 py-12 md:py-16">
        <h1 className="font-serif text-3xl text-[var(--ink)]">Rastrea tu pedido</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Usa la referencia segura incluida en la página de confirmación de tu pedido.
        </p>

        <form method="GET" className="mt-8 flex flex-col gap-3 sm:flex-row">
          <label htmlFor="tracking-reference" className="sr-only">Referencia segura</label>
          <input
            id="tracking-reference"
            name="referencia"
            defaultValue={referencia}
            placeholder="Referencia segura"
            autoComplete="off"
            className="min-h-11 min-w-0 flex-1 border border-[var(--border)] bg-[var(--bg)] px-4 text-sm focus:outline-none"
          />
          <button type="submit" className="min-h-11 bg-[var(--ink)] px-6 text-sm text-[var(--bg)]">
            Consultar
          </button>
        </form>

        {referencia && (!validReference || !order) && (
          <p role="alert" className="mt-6 border border-[#a13a2f] px-4 py-3 text-sm text-[#7f2f27]">
            No encontramos un pedido con esa referencia. Revisa que esté completa.
          </p>
        )}

        {order && (
          <div className="mt-10 space-y-8">
            <div>
              <p className="break-all text-xs text-[var(--text-secondary)]">Pedido #{order.id}</p>
              {order.status === "cancelled" ? (
                <p className="mt-4 border border-[#a13a2f] px-4 py-3 text-sm text-[#7f2f27]">Este pedido fue cancelado.</p>
              ) : (
                <ol className="mt-6 space-y-0">
                  {STATUS_STEPS.map((step, index) => {
                    const reached = currentIndex >= index
                    const active = currentIndex === index
                    return (
                      <li key={step.key} className="grid grid-cols-[16px_1fr] gap-4">
                        <div className="flex flex-col items-center">
                          <span className={`mt-1 h-3 w-3 rounded-full border ${reached ? "border-[var(--ink)] bg-[var(--ink)]" : "border-[var(--border)]"}`} />
                          {index < STATUS_STEPS.length - 1 && <span className="min-h-8 w-px flex-1 bg-[var(--border)]" />}
                        </div>
                        <div className="pb-5">
                          <p className={reached ? "text-sm text-[var(--ink)]" : "text-sm text-[var(--text-secondary)]"}>{step.label}</p>
                          {active && <p className="mt-1 text-xs text-[var(--text-secondary)]">{step.description}</p>}
                        </div>
                      </li>
                    )
                  })}
                </ol>
              )}
            </div>

            {order.tracking_number && (
              <div className="border border-[var(--border)] p-4">
                <p className="text-xs uppercase tracking-[0.1em] text-[var(--text-secondary)]">Número de guía</p>
                <p className="mt-2 break-all text-sm">{order.tracking_number}</p>
                <a
                  href={`https://t.17track.net/es#nums=${encodeURIComponent(order.tracking_number)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex min-h-11 items-center bg-[var(--ink)] px-4 text-sm text-[var(--bg)]"
                >
                  Rastrear envío
                </a>
              </div>
            )}

            <div className="space-y-2 border-t border-[var(--border)] pt-5 text-sm">
              <div className="flex justify-between gap-4"><span className="text-[var(--text-secondary)]">Total</span><span>${Number(order.total).toLocaleString("es-MX")} MXN</span></div>
              {address && <div className="flex justify-between gap-4"><span className="text-[var(--text-secondary)]">Destino</span><span className="text-right">{address.city}, {address.province}</span></div>}
            </div>
          </div>
        )}

        <Link href="/productos" className="mt-10 inline-flex min-h-11 items-center text-sm underline underline-offset-4">
          Seguir comprando
        </Link>
      </div>
    </main>
  )
}
