"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"

interface ProgressEvent {
  type: "start" | "progress" | "done" | "error"
  id?: string
  total?: number
  done?: number
  updated?: number
  failed?: number
  current?: string
  status?: "ok" | "error" | "skip"
  reason?: string
  images?: number
  sizes?: string[]
  colors?: string[]
  message?: string
}

interface LogEntry {
  id: string
  title: string
  status: "ok" | "error" | "skip"
  images?: number
  sizes?: string[]
  colors?: string[]
  reason?: string
}

export default function EnrichButton() {
  const [running, setRunning] = useState(false)
  const [total, setTotal] = useState(0)
  const [done, setDone] = useState(0)
  const [updated, setUpdated] = useState(0)
  const [failed, setFailed] = useState(0)
  const [current, setCurrent] = useState("")
  const [log, setLog] = useState<LogEntry[]>([])
  const [finished, setFinished] = useState(false)
  const [failedIds, setFailedIds] = useState<string[]>([])
  const esRef = useRef<EventSource | null>(null)
  const router = useRouter()

  function startStream(url: string) {
    setRunning(true)
    setFinished(false)
    setTotal(0)
    setDone(0)
    setUpdated(0)
    setFailed(0)
    setCurrent("")
    setLog([])
    setFailedIds([])

    const es = new EventSource(url)
    esRef.current = es

    es.onmessage = (e) => {
      const ev: ProgressEvent = JSON.parse(e.data)

      if (ev.type === "start") {
        setTotal(ev.total ?? 0)
      }

      if (ev.type === "progress") {
        setDone(ev.done ?? 0)
        setUpdated(ev.updated ?? 0)
        setFailed(ev.failed ?? 0)
        setCurrent(ev.current ?? "")

        if (ev.current && ev.id) {
          const entry: LogEntry = {
            id: ev.id,
            title: ev.current,
            status: ev.status ?? "ok",
            images: ev.images,
            sizes: ev.sizes,
            colors: ev.colors,
            reason: ev.reason,
          }
          setLog((prev) => [entry, ...prev.slice(0, 49)])
          if (ev.status === "error") {
            setFailedIds((prev) => [...prev, ev.id!])
          }
        }
      }

      if (ev.type === "done" || ev.type === "error") {
        es.close()
        setRunning(false)
        setFinished(true)
        if (ev.type === "done") router.refresh()
      }
    }

    es.onerror = () => {
      es.close()
      setRunning(false)
      setFinished(true)
    }
  }

  function start() {
    if (running) return
    startStream("/api/cj/enrich")
  }

  function retryFailed() {
    if (running || failedIds.length === 0) return
    startStream(`/api/cj/enrich?ids=${failedIds.join(",")}`)
  }

  function stop() {
    esRef.current?.close()
    setRunning(false)
    setFinished(true)
  }

  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="font-semibold">Enriquecer productos CJ existentes</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Actualiza imágenes (ordenadas por color), tallas y colores desde la API de CJDropshipping.
            Incluye retry automático en caso de rate limiting (429).
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0 ml-4">
          {running && (
            <button
              onClick={stop}
              className="border border-red-300 text-red-600 px-3 py-2 rounded-lg text-sm hover:bg-red-50"
            >
              Detener
            </button>
          )}
          {!running && finished && failedIds.length > 0 && (
            <button
              onClick={retryFailed}
              className="border border-amber-400 text-amber-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-amber-50 flex items-center gap-1.5"
            >
              Reintentar fallidos
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-1.5 py-0.5 rounded-full">
                {failedIds.length}
              </span>
            </button>
          )}
          <button
            onClick={start}
            disabled={running}
            className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {running ? "Enriqueciendo…" : "Iniciar enriquecimiento"}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {(running || finished) && total > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>{done} / {total} productos</span>
            <span>{pct}%</span>
          </div>
          <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: "#e5e7eb" }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${pct}%`,
                background: failed > 0 ? "#f59e0b" : "#111111",
              }}
            />
          </div>
          <div className="flex gap-4 text-xs">
            <span className="text-green-600">✓ {updated} actualizados</span>
            {failed > 0 && (
              <span className="text-amber-600">⚠ {failed} fallidos</span>
            )}
          </div>
          {running && current && (
            <p className="text-xs text-gray-400 truncate">Procesando: {current}</p>
          )}
          {finished && (
            <p className="text-xs font-medium text-gray-700">
              {failed === 0
                ? `✓ Completado — ${updated} productos actualizados`
                : `Completado — ${updated} OK · ${failed} con errores (podés reintentarlos)`}
            </p>
          )}
        </div>
      )}

      {/* Log */}
      {log.length > 0 && (
        <div
          className="mt-4 rounded-lg overflow-y-auto text-xs font-mono space-y-0.5"
          style={{ maxHeight: 220, background: "#f9fafb", padding: "10px 12px" }}
        >
          {log.map((entry, i) => (
            <div key={i} className="flex items-start gap-2">
              <span
                className="flex-shrink-0 w-3"
                style={{
                  color:
                    entry.status === "ok" ? "#16a34a"
                    : entry.status === "error" ? "#d97706"
                    : "#9ca3af",
                }}
              >
                {entry.status === "ok" ? "✓" : entry.status === "error" ? "⚠" : "–"}
              </span>
              <span className="text-gray-700 truncate flex-1">{entry.title}</span>
              {entry.status === "ok" && (
                <span className="text-gray-400 flex-shrink-0">
                  {entry.images}img · {entry.sizes?.join(",")}
                  {entry.colors?.length ? ` · ${entry.colors.slice(0, 3).join(",")}` : ""}
                </span>
              )}
              {entry.status === "error" && (
                <span className="text-amber-500 flex-shrink-0 max-w-[180px] truncate">
                  {entry.reason}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
