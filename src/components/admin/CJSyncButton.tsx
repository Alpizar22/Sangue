"use client"

import { useState } from "react"

interface SyncResult {
  synced: number
  total: number
  page: number
  limit: number
  message?: string
  error?: string
}

const CATEGORIES = [
  { id: "D2432903-0D4E-4787-886F-D3D9DA7890D9", label: "Lady Dresses",              category: "Lady Dresses" },
  { id: "5A3E7341-18B5-4C61-BFCD-8965B3479A9A", label: "Blouses & Shirts",          category: "Blouses & Shirts" },
  { id: "5A053E55-5D18-42EF-A4E7-B08AEA4D9B2F", label: "Soccer Jerseys",            category: "Jerseys" },
  { id: "1357251872037146624",                   label: "Ladies Short Sleeve",       category: "Ladies Short Sleeve" },
]

export default function CJSyncButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SyncResult | null>(null)
  const [categoryId, setCategoryId] = useState(CATEGORIES[0].id)

  async function handleSync() {
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch("/api/cj/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, category: CATEGORIES.find(c => c.id === categoryId)?.category ?? "", page: 1, limit: 20 }),
      })
      const data: SyncResult = await res.json()
      setResult(data)
    } catch {
      setResult({ synced: 0, total: 0, page: 1, limit: 20, error: "Error de red al contactar /api/cj/sync" })
    } finally {
      setLoading(false)
    }
  }

  const isError = !!result?.error

  return (
    <div className="bg-white rounded-xl border p-5 space-y-4">
      <div>
        <h2 className="font-semibold">Sincronizar desde CJ Dropshipping</h2>
        <p className="text-sm text-gray-500 mt-0.5">markup ×2.5 · 20 productos por página</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">
            Categoría
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={loading}
            className="w-full border rounded-lg px-3 py-2 text-sm bg-white disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-black"
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1 font-mono">{categoryId}</p>
        </div>

        <button
          onClick={handleSync}
          disabled={loading}
          className="flex-shrink-0 bg-black text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Sincronizando…" : "Sincronizar"}
        </button>
      </div>

      {result && (
        <div className={`p-3 rounded-lg text-sm ${isError ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {isError ? (
            <span>Error: {result.error}</span>
          ) : (
            <span>
              {result.synced ?? 0} productos sincronizados
              {result.total ? ` (${result.total} disponibles en CJ)` : ""}
              {result.message ? ` — ${result.message}` : ""}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
