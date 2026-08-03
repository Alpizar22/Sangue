"use client"

import { useState } from "react"

interface ActionResult {
  updated?: number
  total?: number
  margin?: string
  error?: string
}

function ActionButton({
  label, endpoint, confirmMsg,
}: {
  label: string
  endpoint: string
  confirmMsg: string
}) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ActionResult | null>(null)

  async function run() {
    if (!confirm(confirmMsg)) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(endpoint, { method: "POST" })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ error: "Error de red" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={run}
        disabled={loading}
        className="px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        {loading ? "Procesando…" : label}
      </button>
      {result && (
        <div className="flex flex-col gap-0.5">
          {result.error && (
            <span className="text-sm text-red-500 break-all max-w-sm">
              Error: {result.error}
            </span>
          )}
          {result.updated !== undefined && (
            <span className={`text-sm ${result.error ? "text-amber-600" : "text-green-600"}`}>
              {result.error ? "⚠" : "✓"}{" "}
              {result.updated} actualizados
              {result.total !== undefined ? ` / ${result.total} total` : ""}
              {result.margin ? ` (margen ${result.margin})` : ""}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default function AdminActions() {
  return (
    <div className="bg-white rounded-xl border p-5 space-y-3">
      <h2 className="font-semibold text-sm text-gray-700">Acciones masivas</h2>
      <ActionButton
        label="Recalcular precios (2.75x)"
        endpoint="/api/admin/recalcular-precios"
        confirmMsg="¿Recalcular precios de todos los productos con margen 2.75x sobre el costo?"
      />
      <ActionButton
        label="Optimizar nombres (ES)"
        endpoint="/api/admin/optimizar-nombres"
        confirmMsg="¿Traducir y acortar títulos de todos los productos? Requiere ANTHROPIC_API_KEY."
      />
    </div>
  )
}
