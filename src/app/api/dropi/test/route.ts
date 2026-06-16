import { NextResponse } from "next/server"

const TEST_ID = 36642
const BASE = "https://api.dropi.mx/api/v1"
const DROPI_TOKEN = process.env.DROPI_TOKEN ?? ""
const DROPI_EMAIL = process.env.DROPI_EMAIL ?? ""
const DROPI_PASSWORD = process.env.DROPI_PASSWORD ?? ""
const DROPI_WHITE_BRAND_ID = process.env.DROPI_WHITE_BRAND_ID ?? ""

const integrationHeaders = {
  "dropi-integracion-key": `Token:${DROPI_TOKEN}`,
  "Content-Type": "application/json",
}

async function probe(url: string, options?: RequestInit) {
  try {
    const res = await fetch(url, { ...options, cache: "no-store" })
    const body = await res.text()
    return { url, method: options?.method ?? "GET", status: res.status, ok: res.ok, body_raw: body }
  } catch (e) {
    return { url, method: options?.method ?? "GET", error: (e as Error).message }
  }
}

export async function GET() {
  // 1-4: variantes de ruta con header de integración
  const [r1, r2, r3, r4] = await Promise.all([
    probe(`${BASE}/dropshipping/products/${TEST_ID}`, { headers: integrationHeaders }),
    probe(`${BASE}/store/products/${TEST_ID}`, { headers: integrationHeaders }),
    probe(`${BASE}/catalog/products/${TEST_ID}`, { headers: integrationHeaders }),
    probe(`${BASE}/products?id=${TEST_ID}`, { headers: integrationHeaders }),
  ])

  // 5: login POST → si funciona, usar el token para pedir el producto
  let loginResult: Record<string, unknown> = {}
  let productWithLoginToken: Record<string, unknown> = {}

  try {
    const loginRes = await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: DROPI_EMAIL,
        password: DROPI_PASSWORD,
        white_brand_id: DROPI_WHITE_BRAND_ID,
      }),
      cache: "no-store",
    })
    const loginBody = await loginRes.text()
    loginResult = { status: loginRes.status, ok: loginRes.ok, body_raw: loginBody }

    if (loginRes.ok) {
      let parsed: Record<string, unknown> = {}
      try { parsed = JSON.parse(loginBody) } catch { /* ignore */ }

      const loginToken: string =
        (parsed.token as string) ??
        (parsed.access_token as string) ??
        ((parsed.data as Record<string, unknown>)?.token as string) ??
        ((parsed.resultado as Record<string, unknown>)?.token as string) ??
        ""

      loginResult.token_found = !!loginToken
      loginResult.token_preview = loginToken ? `${loginToken.slice(0, 8)}...` : "(none)"

      if (loginToken) {
        const bearerHeaders = {
          Authorization: `Bearer ${loginToken}`,
          "Content-Type": "application/json",
        }
        // intentar ruta principal y las variantes con el token de login
        const [pa, pb, pc] = await Promise.all([
          probe(`${BASE}/products/${TEST_ID}`, { headers: bearerHeaders }),
          probe(`${BASE}/dropshipping/products/${TEST_ID}`, { headers: bearerHeaders }),
          probe(`${BASE}/store/products/${TEST_ID}`, { headers: bearerHeaders }),
        ])
        productWithLoginToken = { products_id: pa, dropshipping: pb, store: pc }
      }
    }
  } catch (e) {
    loginResult = { error: (e as Error).message }
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    env: {
      DROPI_TOKEN: DROPI_TOKEN ? `${DROPI_TOKEN.slice(0, 6)}...` : "(vacío)",
      DROPI_EMAIL: DROPI_EMAIL || "(vacío)",
      DROPI_PASSWORD: DROPI_PASSWORD ? "***" : "(vacío)",
      DROPI_WHITE_BRAND_ID: DROPI_WHITE_BRAND_ID || "(vacío)",
    },
    integration_key_probes: { r1_dropshipping: r1, r2_store: r2, r3_catalog: r3, r4_query: r4 },
    login: loginResult,
    product_with_login_token: productWithLoginToken,
  })
}
