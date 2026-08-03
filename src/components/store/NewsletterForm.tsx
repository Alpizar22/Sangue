"use client"

import { useState } from "react"
import styles from "./NewsletterForm.module.css"

export default function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle")

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (state === "loading") return
    setState("loading")

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      setState(response.ok ? "done" : "error")
    } catch {
      setState("error")
    }
  }

  if (state === "done") {
    return <p className={styles.success} role="status">Listo — te avisaremos de nuevas piezas.</p>
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <label htmlFor="newsletter-email" className={styles.srOnly}>Correo electrónico</label>
      <input
        id="newsletter-email"
        type="email"
        required
        value={email}
        onChange={(event) => {
          setEmail(event.target.value)
          if (state === "error") setState("idle")
        }}
        placeholder="Tu correo"
        autoComplete="email"
        aria-describedby={state === "error" ? "newsletter-error" : undefined}
      />
      <button type="submit" disabled={state === "loading"}>
        {state === "loading" ? "Enviando…" : "Suscribirme"}
      </button>
      {state === "error" && (
        <p id="newsletter-error" className={styles.error} role="alert">
          No pudimos guardar tu correo. Intenta de nuevo.
        </p>
      )}
    </form>
  )
}
