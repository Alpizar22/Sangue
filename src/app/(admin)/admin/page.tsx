import { createClient } from "@/lib/supabase/server"

export const metadata = { title: "Dashboard" }

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [{ count: totalProducts }, { count: totalOrders }, { data: recentOrders }] =
    await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase
        .from("orders")
        .select("id, created_at, total, status")
        .order("created_at", { ascending: false })
        .limit(5),
    ])

  const stats = [
    { label: "Productos activos", value: totalProducts ?? 0 },
    { label: "Pedidos totales", value: totalOrders ?? 0 },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-5 border">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-3xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border p-5">
        <h2 className="font-semibold mb-4">Últimos pedidos</h2>
        {recentOrders && recentOrders.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">ID</th>
                <th className="pb-2">Fecha</th>
                <th className="pb-2">Total</th>
                <th className="pb-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id} className="border-b last:border-0">
                  <td className="py-2 font-mono text-xs">{o.id.slice(0, 8)}…</td>
                  <td className="py-2">{new Date(o.created_at).toLocaleDateString("es-AR")}</td>
                  <td className="py-2">${o.total?.toLocaleString("es-AR")}</td>
                  <td className="py-2">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100">{o.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-400 text-sm">No hay pedidos aún</p>
        )}
      </div>
    </div>
  )
}
