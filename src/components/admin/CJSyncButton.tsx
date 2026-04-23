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

interface CategoryResult {
  label: string
  synced: number
  total: number
  error?: string
}

const CATEGORIES = [
  { id: "D2432903-0D4E-4787-886F-D3D9DA7890D9", label: "Lady Dresses",        category: "Lady Dresses" },
  { id: "5A3E7341-18B5-4C61-BFCD-8965B3479A9A", label: "Blouses & Shirts",    category: "Blouses & Shirts" },
  { id: "5A053E55-5D18-42EF-A4E7-B08AEA4D9B2F", label: "Soccer Jerseys",      category: "Jerseys" },
  { id: "1357251872037146624",                   label: "Ladies Short Sleeve", category: "Ladies Short Sleeve" },
]

async function syncCategory(cat: typeof CATEGORIES[number]): Promise<SyncResult> {
  const res = await fetch("/api/cj/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ categoryId: cat.id, category: cat.category, page: 1, limit: 50 }),
  })
  return res.json()
}

export default function CJSyncButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SyncResult | null>(null)
  const [allResults, setAllResults] = useState<CategoryResult[] | null>(null)
  const [categoryId, setCategoryId] = useState(CATEGORIES[0].id)
  const [syncAllProgress, setSyncAllProgress] = useState<string | null>(null)

  async function handleSync() {
    setLoading(true)
    setResult(null)
    setAllResults(null)
    setSyncAllProgress(null)
    try {
      const cat = CATEGORIES.find(c => c.id === categoryId)!
      const data: SyncResult = await syncCategory(cat)
      setResult(data)
    } catch {
      setResult({ synced: 0, total: 0, page: 1, limit: 50, error: "Error de red" })
    } finally {
      setLoading(false)
    }
  }

  async function handleSyncAll() {
    setLoading(true)
    setResult(null)
    setAllResults(null)

    const results: CategoryResult[] = []
    for (const cat of CATEGORIES) {
      setSyncAllProgress(`Sincronizando ${cat.label}…`)
      try {
        const data = await syncCategory(cat)
        results.push({ label: cat.label, synced: data.synced ?? 0, total: data.total ?? 0, error: data.error })
      } catch {
        results.push({ label: cat.label, synced: 0, total: 0, error: "Error de red" })
      }
      // Small delay to respect CJ rate limits
      await new Promise(r => setTimeout(r, 1500))
    }

    setSyncAllProgress(null)
    setAllResults(results)
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-xl border p-5 space-y-4">
      <div>
        <h2 className="font-semibold">Sincronizar desde CJ Dropshipping</h2>
        <p className="text-sm text-gray-500 mt-0.5">Costo real = precio CJ + $120 envío · Margen mínimo 30%</p>
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
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1 font-mono">{categoryId}</p>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={handleSync}
            disabled={loading}
            className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {loading && !syncAllProgress ? "Sincronizando…" : "Sincronizar"}
          </button>
          <button
            onClick={handleSyncAll}
            disabled={loading}
            className="border border-black text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {syncAllProgress ?? "Sync Todo"}
          </button>
        </div>
      </div>

      {result && (
        <div className={`p-3 rounded-lg text-sm ${result.error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {result.error ? `Error: ${result.error}` : (
            `${result.synced ?? 0} productos sincronizados${result.total ? ` (${result.total} disponibles en CJ)` : ""}${result.message ? ` — ${result.message}` : ""}`
          )}
        </div>
      )}

      {allResults && (
        <div className="space-y-1.5">
          {allResults.map((r) => (
            <div
              key={r.label}
              className={`flex justify-between items-center px-3 py-2 rounded-lg text-sm ${r.error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}
            >
              <span className="font-medium">{r.label}</span>
              <span>{r.error ? `Error: ${r.error}` : `${r.synced} sincronizados / ${r.total} disponibles`}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
