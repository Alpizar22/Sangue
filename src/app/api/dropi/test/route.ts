import { NextResponse } from "next/server"
import { getDropiToken, DROPI_BASE } from "@/lib/dropi/client"

export async function GET() {
  const results: Record<string, unknown> = {}

  // 1. Test auth
  try {
    const token = await getDropiToken()
    results.auth = { ok: true, tokenLength: token.length }
  } catch (e) {
    results.auth = { ok: false, error: (e as Error).message }
  }

  // 2. Test product endpoint (with token if auth worked)
  try {
    const testId = 36642
    const res = await fetch(`${DROPI_BASE}/products/${testId}`, {
      headers: {
        Authorization: `Bearer ${results.auth && (results.auth as { ok: boolean }).ok ? "TOKEN_FROM_AUTH" : "no-token"}`,
        Accept: "application/json",
      },
      cache: "no-store",
    })
    const body = await res.text()
    results.products_endpoint = {
      status: res.status,
      ok: res.ok,
      isJson: body.trimStart().startsWith("{") || body.trimStart().startsWith("["),
      preview: body.slice(0, 200),
    }
  } catch (e) {
    results.products_endpoint = { ok: false, error: (e as Error).message }
  }

  return NextResponse.json({
    base: DROPI_BASE,
    timestamp: new Date().toISOString(),
    ...results,
  })
}
