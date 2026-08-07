import { createAdminClient } from "@/lib/supabase/server"
import Link from "next/link"
import type { Product } from "@/types"
import DeleteProductButton from "@/components/admin/DeleteProductButton"

export const metadata = { title: "Productos" }

const MAX_PRODUCTS = 90

export default async function AdminProductsPage() {
  const supabase = await createAdminClient()
  const { data: products, error: fetchError } = await supabase
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })

  if (fetchError) console.error("[productos] fetch error:", fetchError)

  const count = products?.length ?? 0
  const activeCount = products?.filter((product) => product.status === "active").length ?? 0
  const pct = Math.round((count / MAX_PRODUCTS) * 100)
  const nearLimit = count >= 85
  const atLimit = count >= MAX_PRODUCTS

  return (
    <div>
      {/* Contador de productos */}
      <div className="mb-6 p-4 bg-white rounded-xl border space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">{count} productos · {activeCount} activos</span>
          <span className={`font-mono text-xs font-semibold ${atLimit ? "text-red-600" : nearLimit ? "text-amber-600" : "text-gray-500"}`}>
            {count} / {MAX_PRODUCTS}
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${atLimit ? "bg-red-500" : nearLimit ? "bg-amber-400" : "bg-green-500"}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        {nearLimit && !atLimit && (
          <p className="text-xs text-amber-700 font-medium">
            ⚠️ {count}/90 productos — considera eliminar algunos antes de sincronizar
          </p>
        )}
        {atLimit && (
          <p className="text-xs text-red-700 font-medium">
            🚫 Límite alcanzado — elimina productos antes de sincronizar
          </p>
        )}
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Productos</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/productos/nuevo"
            className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800"
          >
            + Nuevo producto
          </Link>
          <Link
            href="/admin/scraping"
            className="border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            Importar de Printful
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-[980px] w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b bg-gray-50 text-gray-700">
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Precio costo</th>
              <th className="px-4 py-3">Precio venta</th>
              <th className="px-4 py-3">Markup</th>
              <th className="px-4 py-3">Orden</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {products?.map((p: Product) => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900">
                  <div className="flex items-center gap-3">
                    {p.images?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.images[0]}
                        alt={p.title}
                        className="w-10 h-10 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <span className="max-w-xs font-medium line-clamp-2">
                      {p.title || <span className="text-gray-400 italic">sin título</span>}
                    </span>
                    {p.featured && <span title="Destacado" className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">DESTACADO</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-900">${Number(p.cost_price).toLocaleString("es-MX")}</td>
                <td className="px-4 py-3 font-semibold text-gray-900">${Number(p.sale_price).toLocaleString("es-MX")}</td>
                <td className="px-4 py-3 text-green-600">{Number(p.markup_percentage).toFixed(0)}%</td>
                <td className="px-4 py-3 text-xs text-gray-500">{p.sort_order ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    p.status === "active" ? "bg-green-100 text-green-700" :
                    p.status === "out_of_stock" ? "bg-yellow-100 text-yellow-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/productos/${p.id}/editar`}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Editar
                    </Link>
                    <DeleteProductButton id={p.id} title={p.title} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!products || products.length === 0) && (
          <p className="text-gray-400 text-sm text-center py-10">
            No hay productos. Impórtalos desde Printful.
          </p>
        )}
      </div>
    </div>
  )
}
