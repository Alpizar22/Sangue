"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"

interface SearchResult {
  id: string
  title: string
  price?: number
  sale_price?: number
  images: string[]
  seccion?: string
}

function useDebounce<T>(value: T, ms: number): T {
  const [deb, setDeb] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDeb(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return deb
}

export default function SearchModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const debouncedQuery = useDebounce(query, 280)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { search(debouncedQuery) }, [debouncedQuery, search])

  function handleResultClick(item: SearchResult) {
    router.push(`/productos/${item.id}`)
    onClose()
  }

  const displayPrice = (item: SearchResult) =>
    item.sale_price ?? item.price ?? 0

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-20 px-4"
      style={{ background: "rgba(26,26,26,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-xl overflow-hidden"
        style={{ background: "var(--paper)", border: "1px solid var(--border)" }}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "rgba(26,26,26,0.1)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.4, flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar productos…"
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)" }}
          />
          {loading && (
            <span className="text-xs opacity-40" style={{ fontFamily: "var(--font-space-mono)" }}>…</span>
          )}
          <button onClick={onClose} className="opacity-40 hover:opacity-70 transition-opacity">
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <ul className="max-h-80 overflow-y-auto divide-y divide-black/5">
            {results.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleResultClick(item)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/5 transition-colors text-left"
                >
                  {item.images?.[0] ? (
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      loading="lazy"
                      className="object-cover flex-shrink-0"
                      style={{ width: 44, height: 44 }}
                    />
                  ) : (
                    <div className="w-11 h-11 flex-shrink-0" style={{ background: "var(--border)" }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--ink)" }}>{item.title}</p>
                    <p className="text-xs mt-0.5 opacity-50" style={{ fontFamily: "var(--font-space-mono)" }}>
                      ${displayPrice(item).toLocaleString("es-MX")} MXN
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {query.length >= 2 && !loading && results.length === 0 && (
          <p className="text-sm text-center py-8 opacity-40" style={{ fontFamily: "var(--font-space-mono)" }}>
            Sin resultados para &ldquo;{query}&rdquo;
          </p>
        )}

        {query.length === 0 && (
          <p className="text-xs text-center py-6 opacity-30" style={{ fontFamily: "var(--font-space-mono)" }}>
            Escribe al menos 2 caracteres
          </p>
        )}
      </div>
    </div>
  )
}
