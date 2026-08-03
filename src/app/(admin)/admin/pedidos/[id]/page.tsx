import { notFound } from "next/navigation"
import Link from "next/link"
import { createServiceClient } from "@/lib/supabase/service"
import { parseOperationalNotes } from "@/lib/orderNotes"

const NOTE_LABELS: Record<string, string> = {
  PRINTFUL_FULFILLMENT_BLOCKED: "Variantes de Printful sin resolver",
  PRINTFUL_API_FAILED: "Fallo de API de Printful",
  PRINTFUL_RECONCILIATION_REQUIRED: "Reconciliación con Printful requerida",
  PAYMENT_VALIDATION_FAILED: "Validación del pago fallida",
  MERCADOPAGO_PREFERENCE_FAILED: "Fallo al crear o guardar la preferencia",
  NOTE: "Nota",
}

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: order } = await createServiceClient()
    .from("orders")
    .select("*, customer:customers(name, email, phone)")
    .eq("id", id)
    .single()
  if (!order) notFound()

  const customer = order.customer as { name?: string; email?: string; phone?: string } | null
  const address = order.shipping_address as Record<string, string | undefined>
  const items = (order.items ?? []) as Array<{
    product_id: string; title?: string; size?: string; color?: string; quantity: number; unit_price: number
  }>
  const notes = parseOperationalNotes(order.notes)
  const requiresReview = order.status === "processing" && !order.supplier_order_id

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link href="/admin/pedidos" className="inline-flex min-h-11 items-center text-sm text-gray-600 underline">Volver a pedidos</Link>
        <h1 className="mt-2 text-2xl font-semibold">Pedido</h1>
        <p className="mt-1 break-all font-mono text-xs text-gray-500">{order.id}</p>
        <p className="mt-1 text-sm text-gray-500">{new Date(order.created_at).toLocaleString("es-MX")}</p>
      </div>

      {requiresReview && (
        <div role="alert" className="border border-amber-500 bg-amber-50 p-4 text-amber-900">
          <p className="font-semibold">Requiere revisión</p>
          <p className="mt-1 text-sm">El pago está registrado, pero todavía no existe una orden de Printful. Revisa las notas antes de intervenir.</p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <AdminSection title="Cliente">
          <Info label="Nombre" value={customer?.name} />
          <Info label="Email" value={customer?.email} breakAll />
          <Info label="Teléfono" value={customer?.phone} />
        </AdminSection>
        <AdminSection title="Dirección">
          <p className="text-sm leading-relaxed text-gray-700">
            {address.street} {address.number}{address.floor ? `, interior ${address.floor}` : ""}<br />
            {address.colonia}{address.municipality ? `, ${address.municipality}` : ""}<br />
            {address.city}, {address.province} {address.postal_code}<br />México
          </p>
        </AdminSection>
      </div>

      <AdminSection title="Artículos">
        <div className="divide-y">
          {items.map((item, index) => (
            <div key={`${item.product_id}-${index}`} className="grid gap-2 py-4 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4">
              <div className="min-w-0">
                <p className="break-words font-medium">{item.title || item.product_id}</p>
                <p className="mt-1 text-gray-500">Color: {item.color || "—"} · Talla: {item.size || "—"} · Cantidad: {item.quantity}</p>
              </div>
              <p className="whitespace-nowrap">${(Number(item.unit_price) * item.quantity).toLocaleString("es-MX")} MXN</p>
            </div>
          ))}
        </div>
        <div className="ml-auto mt-4 max-w-sm space-y-2 border-t pt-4 text-sm">
          <Money label="Subtotal" value={Number(order.subtotal)} />
          <Money label="Envío" value={Number(order.shipping_cost)} />
          <Money label="Total" value={Number(order.total)} strong />
        </div>
      </AdminSection>

      <div className="grid gap-5 lg:grid-cols-2">
        <AdminSection title="Pago y fulfillment">
          <Info label="Estado" value={order.status} />
          <Info label="Payment ID" value={order.mercadopago_payment_id} breakAll />
          <Info label="Preference ID" value={order.mercadopago_preference_id} breakAll />
          <Info label="Printful order ID" value={order.supplier_order_id} breakAll />
          <Info label="Tracking" value={order.tracking_number} breakAll />
          <Info label="Estado de fulfillment" value={requiresReview ? "Requiere revisión" : order.supplier_order_id ? "Enviado a Printful" : "Aún no enviado"} />
        </AdminSection>
        <AdminSection title="Notas operativas">
          {notes.length === 0 ? <p className="text-sm text-gray-500">Sin notas.</p> : (
            <div className="space-y-3">
              {notes.map((note, index) => (
                <div key={`${note.type}-${index}`} className="border border-gray-200 p-3">
                  <p className="text-sm font-medium">{NOTE_LABELS[note.type] ?? note.type}</p>
                  {note.details ? <NoteDetails details={note.details} /> : <p className="mt-2 break-words text-xs text-gray-600">{note.raw}</p>}
                </div>
              ))}
            </div>
          )}
        </AdminSection>
      </div>
    </div>
  )
}

function AdminSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="border border-gray-200 bg-white p-4 sm:p-5"><h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.08em] text-gray-500">{title}</h2>{children}</section>
}

function Info({ label, value, breakAll = false }: { label: string; value: unknown; breakAll?: boolean }) {
  return <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 border-b py-2 text-sm last:border-0"><span className="text-gray-500">{label}</span><span className={breakAll ? "break-all" : "break-words"}>{value ? String(value) : "—"}</span></div>
}

function Money({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return <div className={`flex justify-between gap-3 ${strong ? "font-semibold" : ""}`}><span className="text-gray-500">{label}</span><span>${value.toLocaleString("es-MX")} MXN</span></div>
}

function NoteDetails({ details }: { details: Record<string, unknown> }) {
  if (Array.isArray(details.errors)) {
    return <ul className="mt-2 space-y-2 text-xs text-gray-700">{details.errors.map((error, index) => {
      const item = error as Record<string, unknown>
      return <li key={index} className="border-l-2 border-amber-500 pl-2">Producto: {String(item.product ?? "—")} · Color: {String(item.color ?? "—")} · Talla: {String(item.size ?? "—")}<br />Motivo: {String(item.reason ?? "—")}</li>
    })}</ul>
  }
  return <dl className="mt-2 space-y-1 text-xs text-gray-700">{Object.entries(details).map(([key, value]) => <div key={key} className="grid grid-cols-[120px_minmax(0,1fr)] gap-2"><dt className="text-gray-500">{key}</dt><dd className="break-all">{typeof value === "object" ? JSON.stringify(value) : String(value)}</dd></div>)}</dl>
}
