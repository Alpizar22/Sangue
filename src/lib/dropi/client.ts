const BASE = "https://app.dropi.mx/api/v1"

function token(): string {
  const t = process.env.DROPI_TOKEN
  if (!t) throw new Error("DROPI_TOKEN no configurado")
  return t
}

export async function dropiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token()}` },
    cache: "no-store",
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`Dropi ${res.status} GET ${path}: ${txt.slice(0, 200)}`)
  }
  return res.json()
}

export async function dropiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`Dropi ${res.status} POST ${path}: ${txt.slice(0, 200)}`)
  }
  return res.json()
}
