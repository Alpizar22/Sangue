import { createAdminClient } from "@/lib/supabase/server"
import Link from "next/link"
import type { Product } from "@/types"
import DeleteProductButton from "@/components/admin/DeleteProductButton"

export const metadata = { title: "Productos" }

export default async function AdminProductsPage() {
  const supabase = await createAdminClient()
  const { data: products, error: fetchError } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })

  if (fetchError) console.error("[productos] fetch error:", fetchError)
  if (products?.length) console.log("[productos] first row keys:", Object.keys(products[0]))

  return (
    <div>
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
            Importar desde Shein
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b bg-gray-50 text-gray-700">
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Precio costo</th>
              <th className="px-4 py-3">Precio venta</th>
              <th className="px-4 py-3">Markup</th>
              <th className="px-4 py-3">Sección</th>
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
                    <span className="font-medium line-clamp-2 max-w-xs">
                      {p.title || <span className="text-gray-400 italic">sin título</span>}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-900">${Number(p.cost_price).toLocaleString("es-MX")}</td>
                <td className="px-4 py-3 font-semibold text-gray-900">${Number(p.sale_price).toLocaleString("es-MX")}</td>
                <td className="px-4 py-3 text-green-600">{Number(p.markup_percentage).toFixed(0)}%</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{p.seccion ?? "—"}</td>
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
            No hay productos. Usa el scraper para importar desde Shein.
          </p>
        )}
      </div>
    </div>
  )
}
