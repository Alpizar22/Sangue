export const DROPI_BASE = "https://api.dropi.mx/api/v1"

interface TokenCache {
  token: string
  expiresAt: number
}

// In-process cache — valid for 23 h, refreshed automatically
let _cache: TokenCache | null = null

export async function getDropiToken(): Promise<string> {
  const now = Date.now()
  if (_cache && _cache.expiresAt > now + 3_600_000) {
    return _cache.token
  }

  const email = process.env.DROPI_EMAIL
  const password = process.env.DROPI_PASSWORD
  const white_brand_id = process.env.DROPI_WHITE_BRAND_ID

  if (!email || !password || !white_brand_id) {
    throw new Error("Faltan variables: DROPI_EMAIL, DROPI_PASSWORD, DROPI_WHITE_BRAND_ID")
  }

  const res = await fetch(`${DROPI_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, white_brand_id }),
    cache: "no-store",
  })

  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`Dropi auth ${res.status}: ${txt.slice(0, 300)}`)
  }

  const data = await res.json()
  const token: string | undefined =
    data.token ?? data.access_token ?? data.data?.token ?? data.resultado?.token

  if (!token) {
    throw new Error(`Dropi login sin token. Respuesta: ${JSON.stringify(data).slice(0, 300)}`)
  }

  _cache = { token, expiresAt: now + 23 * 3_600_000 }
  console.log("[dropi] token obtenido y cacheado 23h")
  return token
}

export async function dropiGet<T>(path: string): Promise<T> {
  const token = await getDropiToken()
  const res = await fetch(`${DROPI_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`Dropi ${res.status} GET ${path}: ${txt.slice(0, 300)}`)
  }
  return res.json()
}

export async function dropiPost<T>(path: string, body: unknown): Promise<T> {
  const token = await getDropiToken()
  const res = await fetch(`${DROPI_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`Dropi ${res.status} POST ${path}: ${txt.slice(0, 300)}`)
  }
  return res.json()
}
