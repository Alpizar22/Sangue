import { NextResponse } from "next/server"

const TEST_ID = 36642
const DROPI_TOKEN = process.env.DROPI_TOKEN ?? ""

async function probeUrl(url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        "dropi-integracion-key": `Token:${DROPI_TOKEN}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })
    const body = await res.text()
    return {
      url,
      status: res.status,
      ok: res.ok,
      headers: Object.fromEntries(res.headers.entries()),
      body_raw: body,
    }
  } catch (e) {
    return { url, error: (e as Error).message }
  }
}

export async function GET() {
  const tokenPresent = !!DROPI_TOKEN
  const tokenPreview = DROPI_TOKEN ? `${DROPI_TOKEN.slice(0, 6)}...` : "(vacío)"

  const [appResult, apiResult] = await Promise.all([
    probeUrl(`https://app.dropi.mx/api/v1/products/${TEST_ID}`),
    probeUrl(`https://api.dropi.mx/api/v1/products/${TEST_ID}`),
  ])

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    env: { tokenPresent, tokenPreview },
    app_dropi_mx: appResult,
    api_dropi_mx: apiResult,
  })
}
