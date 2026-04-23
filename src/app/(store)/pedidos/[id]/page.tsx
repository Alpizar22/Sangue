import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Tu pedido — Theia" }

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ status?: string }>
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente de pago",
  paid: "Pago confirmado",
  processing: "En preparación",
  ordered_to_supplier: "Pedido al proveedor",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
}

export default async function OrderPage({ params, searchParams }: Props) {
  const { id } = await params
  const { status: queryStatus } = await searchParams

  const supabase = await createClient()
  const { data: order } = await supabase
    .from("orders")
    .select("*, customers(name, email)")
    .eq("id", id)
    .single()

  if (!order) notFound()

  const isSuccess = queryStatus === "success"
  const isPending = queryStatus === "pending"

  return (
    <div style={{ background: "var(--bg)", minHeight: "60vh" }}>
      <div className="max-w-2xl mx-auto px-4 py-10 md:py-16 space-y-8">

        {/* Status banner */}
        {isSuccess && (
          <div
            className="rounded-xl px-6 py-5 text-center space-y-1"
            style={{ background: "#d1fae5", border: "1px solid #6ee7b7" }}
          >
            <p className="text-lg font-semibold" style={{ color: "#065f46" }}>¡Pago recibido!</p>
            <p className="text-sm" style={{ color: "#047857" }}>
              Te enviaremos un correo cuando tu pedido sea despachado.
            </p>
          </div>
        )}
        {isPending && (
          <div
            className="rounded-xl px-6 py-5 text-center space-y-1"
            style={{ background: "#fef9c3", border: "1px solid #fde047" }}
          >
            <p className="text-lg font-semibold" style={{ color: "#713f12" }}>Pago pendiente</p>
            <p className="text-sm" style={{ color: "#92400e" }}>
              Tu pago está siendo procesado. Te avisaremos cuando se confirme.
            </p>
          </div>
        )}

        {/* Order header */}
        <div>
          <p
            className="text-[10px] uppercase tracking-[0.2em] mb-1"
            style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.4 }}
          >
            Pedido
          </p>
          <p
            className="text-sm break-all"
            style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.6 }}
          >
            #{order.id}
          </p>
        </div>

        {/* Status pill */}
        <div className="flex items-center gap-3">
          <span
            className="text-[10px] uppercase tracking-[0.15em] px-3 py-1.5 rounded-full"
            style={{
              fontFamily: "var(--font-space-mono)",
              background: order.status === "delivered" ? "#d1fae5"
                : order.status === "shipped" ? "#dbeafe"
                : order.status === "cancelled" ? "#fee2e2"
                : "rgba(26,26,26,0.08)",
              color: order.status === "delivered" ? "#065f46"
                : order.status === "shipped" ? "#1e40af"
                : order.status === "cancelled" ? "#991b1b"
                : "var(--ink)",
            }}
          >
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
          {order.tracking_number && (
            <span
              className="text-[11px]"
              style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.5 }}
            >
              Guía: {order.tracking_number}
            </span>
          )}
        </div>

        {/* Items */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid rgba(26,26,26,0.1)" }}
        >
          <div
            className="px-5 py-3 text-[10px] uppercase tracking-[0.2em]"
            style={{
              fontFamily: "var(--font-space-mono)",
              background: "var(--paper)",
              borderBottom: "1px solid rgba(26,26,26,0.08)",
              color: "var(--ink)",
              opacity: 0.5,
            }}
          >
            Productos
          </div>
          <div className="divide-y" style={{ borderColor: "rgba(26,26,26,0.06)" }}>
            {(order.items as Array<{
              product_id: string; quantity: number; size: string; color: string; unit_price: number
            }>).map((item, i) => (
              <div key={i} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate" style={{ color: "var(--ink)" }}>
                    {item.size && <span className="opacity-50 mr-2">{item.size}</span>}
                    {item.color && <span className="opacity-50 mr-2">{item.color}</span>}
                    ×{item.quantity}
                  </p>
                </div>
                <p
                  className="text-sm font-medium whitespace-nowrap"
                  style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)" }}
                >
                  ${(item.unit_price * item.quantity).toLocaleString("es-MX")}
                </p>
              </div>
            ))}
          </div>
          <div
            className="px-5 py-4 flex justify-between items-center"
            style={{
              borderTop: "1px solid rgba(26,26,26,0.1)",
              background: "var(--paper)",
            }}
          >
            <span
              className="text-[11px] uppercase tracking-[0.15em]"
              style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.5 }}
            >
              Total
            </span>
            <span
              className="text-base font-semibold"
              style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)" }}
            >
              ${Number(order.total).toLocaleString("es-MX")}
            </span>
          </div>
        </div>

        {/* Shipping address */}
        {order.shipping_address && (
          <div>
            <p
              className="text-[10px] uppercase tracking-[0.2em] mb-2"
              style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.4 }}
            >
              Dirección de envío
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--ink)", opacity: 0.7 }}>
              {order.shipping_address.street} {order.shipping_address.number}
              {order.shipping_address.floor && `, piso ${order.shipping_address.floor}`}
              {order.shipping_address.apartment && ` dept. ${order.shipping_address.apartment}`}
              <br />
              {order.shipping_address.city}, {order.shipping_address.province}{" "}
              {order.shipping_address.postal_code}
            </p>
          </div>
        )}

        <Link
          href="/productos"
          className="inline-block text-[11px] uppercase tracking-[0.2em] transition-opacity hover:opacity-70"
          style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.5 }}
        >
          ← Seguir comprando
        </Link>

      </div>
    </div>
  )
}
