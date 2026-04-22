const CJ_BASE = "https://developers.cjdropshipping.com/api2.0/v1"

interface TokenCache {
  token: string
  refreshToken: string
  expiresAt: number // ms
}

// Module-level cache — valid for the lifetime of the server process.
// On Vercel serverless each cold start re-authenticates automatically.
let tokenCache: TokenCache | null = null

async function fetchToken(): Promise<TokenCache> {
  const apiKey = process.env.CJ_API_KEY
  if (!apiKey) throw new Error("CJ_API_KEY no configurado")

  const url = `${CJ_BASE}/authentication/getAccessToken`

  console.log("[CJ auth] →", url)
  console.log("[CJ auth] body:", JSON.stringify({ apiKey: apiKey.slice(0, 6) + "***" }))

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey }),
  })

  const raw = await res.text()
  console.log("[CJ auth] HTTP status:", res.status)
  console.log("[CJ auth] response body:", raw)

  let json: Record<string, unknown>
  try {
    json = JSON.parse(raw)
  } catch {
    throw new Error(`CJ auth: respuesta no es JSON (status ${res.status}): ${raw.slice(0, 200)}`)
  }

  if (!json.result || !(json.data as Record<string, unknown>)?.accessToken) {
    throw new Error(`CJ auth falló — code: ${json.code}, message: "${json.message}"`)
  }

  const data = json.data as Record<string, unknown>
  return {
    token: data.accessToken as string,
    refreshToken: data.refreshToken as string,
    expiresAt: new Date(data.tokenExpiryDate as string).getTime() - 5 * 60 * 1000,
  }
}

async function refreshToken(rt: string): Promise<TokenCache> {
  const res = await fetch(`${CJ_BASE}/authentication/refreshAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: rt }),
  })

  const json = await res.json()
  if (!json.result || !json.data?.accessToken) {
    // Refresh failed — fall back to full re-auth
    return fetchToken()
  }

  return {
    token: json.data.accessToken,
    refreshToken: json.data.refreshToken ?? rt,
    expiresAt: new Date(json.data.tokenExpiryDate).getTime() - 5 * 60 * 1000,
  }
}

export async function getAccessToken(): Promise<string> {
  if (!tokenCache) {
    tokenCache = await fetchToken()
    return tokenCache.token
  }

  if (Date.now() >= tokenCache.expiresAt) {
    tokenCache = await refreshToken(tokenCache.refreshToken)
  }

  return tokenCache.token
}

// ─── Base request helper ──────────────────────────────────────────────────────

export async function cjGet<T = unknown>(path: string, params?: Record<string, string | number>): Promise<T> {
  const token = await getAccessToken()
  const url = new URL(`${CJ_BASE}${path}`)
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v))
  }

  const res = await fetch(url.toString(), {
    headers: { "CJ-Access-Token": token },
  })

  const json = await res.json()
  if (json.code !== 200) throw new Error(`CJ GET ${path} error: ${json.message}`)
  return json.data as T
}

export async function cjPost<T = unknown>(path: string, body: unknown): Promise<T> {
  const token = await getAccessToken()

  const res = await fetch(`${CJ_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "CJ-Access-Token": token,
    },
    body: JSON.stringify(body),
  })

  const json = await res.json()
  if (json.code !== 200) throw new Error(`CJ POST ${path} error: ${json.message}`)
  return json.data as T
}
