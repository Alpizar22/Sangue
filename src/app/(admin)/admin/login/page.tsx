"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AdminLoginPage() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })

    if (!res.ok) {
      setError("Clave incorrecta")
      setLoading(false)
      return
    }

    router.push("/admin")
    router.refresh()
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg)" }}
    >
      <div
        className="w-full max-w-sm p-8"
        style={{ border: "1px solid rgba(26,26,26,0.1)", background: "var(--paper)" }}
      >
        <p
          className="text-3xl italic mb-1"
          style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)" }}
        >
          Theia
        </p>
        <p
          className="text-[10px] uppercase tracking-[0.25em] mb-10"
          style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.35 }}
        >
          Panel de administración
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              className="block text-[10px] uppercase tracking-[0.2em] mb-2"
              style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.5 }}
            >
              Clave de acceso
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              className="w-full px-3 py-2.5 text-sm focus:outline-none"
              style={{
                fontFamily: "var(--font-space-mono)",
                border: "1px solid rgba(26,26,26,0.2)",
                background: "var(--bg)",
                color: "var(--ink)",
              }}
            />
          </div>

          {error && (
            <p
              className="text-[11px]"
              style={{ fontFamily: "var(--font-space-mono)", color: "#d63031" }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-[11px] uppercase tracking-[0.2em] transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{
              fontFamily: "var(--font-space-mono)",
              background: "var(--ink)",
              color: "var(--bg)",
            }}
          >
            {loading ? "Verificando..." : "Acceder"}
          </button>
        </form>
      </div>
    </div>
  )
}
