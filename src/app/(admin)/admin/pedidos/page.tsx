import { createClient } from "@/lib/supabase/server"
import type { Order } from "@/types"
import Link from "next/link"

export const metadata = { title: "Pedidos" }

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  processing: "Procesando",
  ordered_to_supplier: "Pedido a Shein",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700",
  ordered_to_supplier: "bg-indigo-100 text-indigo-700",
  shipped: "bg-cyan-100 text-cyan-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
}

export default async function AdminOrdersPage() {
  const supabase = await createClient()
  const { data: orders } = await supabase
    .from("orders")
    .select("*, customer:customers(name, email)")
    .order("created_at", { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Pedidos</h1>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b bg-gray-50">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Pedido en Shein</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {orders?.map((o: Order & { customer?: { name: string; email: string } }) => (
              <tr key={o.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{o.id.slice(0, 8)}…</td>
                <td className="px-4 py-3">
                  <div>{o.customer?.name || "—"}</div>
                  <div className="text-gray-400 text-xs">{o.customer?.email}</div>
                </td>
                <td className="px-4 py-3 font-semibold">${o.total?.toLocaleString("es-AR")}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[o.status] || "bg-gray-100"}`}>
                    {STATUS_LABELS[o.status] || o.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {o.supplier_order_id ? (
                    <span className="text-xs text-green-600 font-medium">{o.supplier_order_id}</span>
                  ) : (
                    <span className="text-xs text-gray-400">No enviado</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(o.created_at).toLocaleDateString("es-AR")}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/pedidos/${o.id}`} className="text-blue-600 hover:underline text-xs">
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!orders || orders.length === 0) && (
          <p className="text-gray-400 text-sm text-center py-10">No hay pedidos aún</p>
        )}
      </div>
    </div>
  )
}
