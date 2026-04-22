import { createAdminClient } from "@/lib/supabase/server"
import type { PricingRule } from "@/types"
import { createPricingRule, togglePricingRule, deletePricingRule } from "./actions"

export const metadata = { title: "Precios" }

export default async function PreciosPage() {
  const supabase = await createAdminClient()
  const { data: rules } = await supabase
    .from("pricing_rules")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Reglas de precios</h1>
          <p className="text-sm text-gray-500 mt-1">
            Define markups por categoría o rango de precio de costo.
          </p>
        </div>
      </div>

      {/* Tabla de reglas */}
      <div className="bg-white rounded-xl border overflow-hidden mb-8">
        {rules && rules.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b bg-gray-50">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Rango costo</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule: PricingRule) => (
                <tr key={rule.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{rule.name}</td>
                  <td className="px-4 py-3 text-gray-500">{rule.category ?? "Todas"}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-100">
                      {rule.markup_type === "percentage" ? "%" : "$"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {rule.markup_type === "percentage"
                      ? `${rule.markup_value}%`
                      : `$${Number(rule.markup_value).toLocaleString("es-MX")}`}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {rule.min_price != null || rule.max_price != null
                      ? `$${rule.min_price ?? 0} – ${rule.max_price != null ? `$${rule.max_price}` : "∞"}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <form action={togglePricingRule.bind(null, rule.id, !rule.active)}>
                      <button
                        type="submit"
                        className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                          rule.active
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {rule.active ? "Activa" : "Inactiva"}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <form action={deletePricingRule.bind(null, rule.id)}>
                      <button
                        type="submit"
                        className="text-red-500 hover:text-red-700 text-xs"
                        onClick={(e) => {
                          if (!confirm("¿Eliminar esta regla?")) e.preventDefault()
                        }}
                      >
                        Eliminar
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-400 text-sm text-center py-10">
            No hay reglas de precios. Creá la primera abajo.
          </p>
        )}
      </div>

      {/* Formulario nueva regla */}
      <div className="bg-white rounded-xl border p-5">
        <h2 className="font-semibold mb-4">Nueva regla de precio</h2>
        <form action={createPricingRule} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre</label>
              <input
                name="name"
                required
                placeholder="Ej: Dresses markup 80%"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Categoría (opcional)</label>
              <input
                name="category"
                placeholder="Lady Dresses, Jerseys, ..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo de markup</label>
              <select
                name="markup_type"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
              >
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed">Fijo ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Valor</label>
              <input
                name="markup_value"
                type="number"
                required
                min={0}
                step="0.01"
                placeholder="80"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Precio costo mínimo (opcional)</label>
              <input
                name="min_price"
                type="number"
                min={0}
                step="0.01"
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Precio costo máximo (opcional)</label>
              <input
                name="max_price"
                type="number"
                min={0}
                step="0.01"
                placeholder="Sin límite"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          <button
            type="submit"
            className="bg-black text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800"
          >
            Crear regla
          </button>
        </form>
      </div>
    </div>
  )
}
