import { NextResponse } from "next/server"
import { ADMIN_SESSION_MAX_AGE, createAdminSession, isAdminPasswordMatch } from "@/lib/adminSession"
import { adminLoginClientKey, adminLoginRateLimiter } from "@/lib/adminRateLimit"

function rateLimitedResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "Demasiados intentos. Intenta nuevamente más tarde." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  )
}

export async function POST(request: Request) {
  const clientKey = adminLoginClientKey(request.headers)
  const currentLimit = adminLoginRateLimiter.check(clientKey)
  if (!currentLimit.allowed) return rateLimitedResponse(currentLimit.retryAfterSeconds)

  let password: unknown
  try {
    const body = await request.json() as { password?: unknown }
    password = body.password
  } catch {
    password = undefined
  }
  const adminPassword = process.env.ADMIN_PASSWORD
  const passwordMatches = await isAdminPasswordMatch(password, adminPassword)

  if (!adminPassword || !passwordMatches) {
    const updatedLimit = adminLoginRateLimiter.recordFailure(clientKey)
    if (!updatedLimit.allowed) return rateLimitedResponse(updatedLimit.retryAfterSeconds)
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
  }

  adminLoginRateLimiter.reset(clientKey)
  const response = NextResponse.json({ ok: true })
  response.cookies.set("admin_session", await createAdminSession(adminPassword), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ADMIN_SESSION_MAX_AGE,
    path: "/",
  })
  return response
}
