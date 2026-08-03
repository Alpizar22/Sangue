import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import ClearCartOnSuccess from "@/components/store/ClearCartOnSuccess"
import { createServiceClient } from "@/lib/supabase/service"

export const metadata: Metadata = { title: "Tu pedido — Theia" }

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ status?: string; token?: string }>
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente de pago",
  paid: "Pago confirmado",
  processing: "En preparación",
  ordered_to_supplier: "En producción",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
}

const PAID_STATES = new Set(["paid", "processing", "ordered_to_supplier", "shipped", "delivered"])

export default async function OrderPage({ params, searchParams }: Props) {
  const { id } = await params
  const { status: returnStatus, token = "" } = await searchParams
  if (!/^[a-f0-9]{64}$/i.test(token)) notFound()

  const { data: order } = await createServiceClient()
    .from("orders")
    .select("id, created_at, items, status, subtotal, shipping_cost, total, shipping_address, tracking_number")
    .eq("id", id)
    .eq("public_access_token", token)
    .single()
  if (!order) notFound()

  const paymentConfirmed = PAID_STATES.has(order.status)
  const verifying = returnStatus === "success" && order.status === "pending"
  const pending = returnStatus === "pending" || (!paymentConfirmed && order.status === "pending")
  const requiresReview = order.status === "processing"
  const address = order.shipping_address as {
    street?: string; number?: string; floor?: string; colonia?: string
    municipality?: string; city?: string; province?: string; postal_code?: string
  } | null
  const items = (order.items ?? []) as Array<{
    product_id: string; title?: string; quantity: number; size: string; color: string; unit_price: number
  }>

  return (
    <main className="min-h-[60vh] bg-[var(--bg)]">
      {paymentConfirmed && <ClearCartOnSuccess />}
      <div className="mx-auto max-w-2xl space-y-8 px-4 py-10 md:py-16">
        {verifying && (
          <StatusMessage title="Estamos verificando tu pago">
            MercadoPago nos está enviando la confirmación. Actualiza esta página en unos momentos.
          </StatusMessage>
        )}
        {!verifying && pending && (
          <StatusMessage title="Pago pendiente">
            Tu pedido está registrado, pero el pago todavía no aparece como aprobado.
          </StatusMessage>
        )}
        {paymentConfirmed && !requiresReview && (
          <StatusMessage title={order.status === "shipped" ? "Tu pedido está en camino" : "Pago confirmado"} success>
            {order.status === "shipped"
              ? "Consulta tu guía debajo para seguir el envío."
              : "Tu pedido ya está siendo preparado."}
          </StatusMessage>
        )}
        {requiresReview && (
          <StatusMessage title="Pago confirmado · revisión en curso">
            Recibimos tu pago. Estamos verificando los detalles de preparación de tu pedido; no necesitas volver a pagar.
          </StatusMessage>
        )}
        {order.status === "cancelled" && (
          <StatusMessage title="Pedido cancelado">Este pedido fue cancelado.</StatusMessage>
        )}

        <header>
          <p className="mb-1 text-[10px] uppercase tracking-[0.12em] text-[var(--text-secondary)]">Pedido</p>
          <p className="break-all text-sm text-[var(--text-secondary)]">#{order.id}</p>
          <p className="mt-3 text-sm text-[var(--ink)]">{STATUS_LABELS[order.status] ?? order.status}</p>
        </header>

        <section className="border border-[var(--border)] p-4">
          <h2 className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-secondary)]">Referencia segura de seguimiento</h2>
          <p className="mt-2 break-all font-mono text-xs text-[var(--ink)]">{token}</p>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">Guarda esta referencia: permite consultar el pedido sin exponerlo públicamente.</p>
          <Link
            href={`/ayuda/seguimiento?referencia=${encodeURIComponent(token)}`}
            className="mt-3 inline-flex min-h-11 items-center text-sm underline underline-offset-4"
          >
            Abrir seguimiento
          </Link>
        </section>

        <section className="border border-[var(--border)]" aria-labelledby="order-products">
          <h2 id="order-products" className="border-b border-[var(--border)] px-4 py-3 text-[10px] uppercase tracking-[0.12em] text-[var(--text-secondary)]">
            Productos
          </h2>
          <div className="divide-y divide-[var(--border)]">
            {items.map((item, index) => (
              <div key={`${item.product_id}-${index}`} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 px-4 py-4 text-sm">
                <div className="min-w-0">
                  <p className="break-words text-[var(--ink)]">{item.title || "Pieza Theia"}</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    {[item.color, item.size].filter(Boolean).join(" · ")} · ×{item.quantity}
                  </p>
                </div>
                <p className="whitespace-nowrap text-[var(--ink)]">
                  ${(Number(item.unit_price) * item.quantity).toLocaleString("es-MX")} MXN
                </p>
              </div>
            ))}
          </div>
          <div className="space-y-2 border-t border-[var(--border)] bg-[var(--paper)] px-4 py-4 text-sm">
            <MoneyRow label="Subtotal" amount={Number(order.subtotal)} />
            <MoneyRow label="Envío" amount={Number(order.shipping_cost)} />
            <MoneyRow label="Total" amount={Number(order.total)} strong />
          </div>
        </section>

        {address && (
          <section>
            <h2 className="mb-2 text-[10px] uppercase tracking-[0.12em] text-[var(--text-secondary)]">Dirección de envío</h2>
            <address className="not-italic text-sm leading-relaxed text-[var(--text-secondary)]">
              {address.street} {address.number}{address.floor ? `, interior ${address.floor}` : ""}<br />
              {address.colonia ? `${address.colonia}, ` : ""}{address.municipality ? `${address.municipality}, ` : ""}
              {address.city}, {address.province} {address.postal_code}<br />México
            </address>
          </section>
        )}

        {order.tracking_number && (
          <section className="border border-[var(--border)] p-4">
            <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-secondary)]">Guía</p>
            <p className="mt-2 break-all text-sm">{order.tracking_number}</p>
          </section>
        )}

        <Link href="/productos" className="inline-flex min-h-11 items-center text-sm underline underline-offset-4">
          Seguir comprando
        </Link>
      </div>
    </main>
  )
}

function StatusMessage({ title, children, success = false }: { title: string; children: React.ReactNode; success?: boolean }) {
  return (
    <div role="status" className={`border px-4 py-4 ${success ? "border-[#55705c]" : "border-[var(--border)]"}`}>
      <p className="font-medium text-[var(--ink)]">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">{children}</p>
    </div>
  )
}

function MoneyRow({ label, amount, strong = false }: { label: string; amount: number; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "border-t border-[var(--border)] pt-2 font-medium" : ""}`}>
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className="whitespace-nowrap">${amount.toLocaleString("es-MX")} MXN</span>
    </div>
  )
}
