"use client"

import { useState } from "react"

export default function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (state === "loading") return
    setState("loading")
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      setState(res.ok ? "done" : "error")
    } catch {
      setState("error")
    }
  }

  if (state === "done") {
    return (
      <p
        className="text-[13px]"
        style={{ fontFamily: "var(--font-inter)", color: "var(--text-secondary)" }}
      >
        Listo — te avisaremos de nuevas piezas.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-stretch max-w-sm w-full">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Tu correo"
        className="flex-1 min-w-0 bg-transparent px-0 py-2 text-[13px] focus:outline-none"
        style={{
          fontFamily: "var(--font-inter)",
          color: "var(--ink)",
          borderBottom: "1px solid var(--border)",
        }}
      />
      <button
        type="submit"
        disabled={state === "loading"}
        className="text-[11px] uppercase tracking-[0.1em] ml-4 px-4 transition-opacity hover:opacity-70 disabled:opacity-40"
        style={{ fontFamily: "var(--font-inter)", fontWeight: 500, color: "var(--ink)", borderBottom: "1px solid var(--ink)" }}
      >
        {state === "loading" ? "…" : "Suscribir"}
      </button>
      {state === "error" && (
        <span className="sr-only" role="alert">Ocurrió un error, intenta de nuevo</span>
      )}
    </form>
  )
}
