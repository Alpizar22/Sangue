"use client"

import { useState } from "react"

interface ActionResult {
  updated?: number
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
        <span className={`text-sm ${result.error ? "text-red-500" : "text-green-600"}`}>
          {result.error
            ? `Error: ${result.error}`
            : `✓ ${result.updated ?? 0} actualizados${result.margin ? ` (margen ${result.margin})` : ""}`}
        </span>
      )}
    </div>
  )
}

export default function AdminActions() {
  return (
    <div className="bg-white rounded-xl border p-5 space-y-3">
      <h2 className="font-semibold text-sm text-gray-700">Acciones masivas</h2>
      <ActionButton
        label="Recalcular precios (40%)"
        endpoint="/api/admin/recalcular-precios"
        confirmMsg="¿Recalcular precios de todos los productos con margen 40%?"
      />
      <ActionButton
        label="Optimizar nombres (ES)"
        endpoint="/api/admin/optimizar-nombres"
        confirmMsg="¿Traducir y acortar títulos de todos los productos? Requiere ANTHROPIC_API_KEY."
      />
    </div>
  )
}
