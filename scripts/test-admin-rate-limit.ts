import assert from "node:assert/strict"
import {
  ADMIN_LOGIN_COOLDOWN_MS,
  ADMIN_LOGIN_MAX_FAILURES,
  AdminLoginRateLimiter,
  adminLoginClientKey,
} from "../src/lib/adminRateLimit.ts"
import { createAdminSession, isAdminPasswordMatch, isValidAdminSession } from "../src/lib/adminSession.ts"

const now = 1_700_000_000_000

{
  const limiter = new AdminLoginRateLimiter()
  for (let attempt = 1; attempt < ADMIN_LOGIN_MAX_FAILURES; attempt++) {
    assert.equal(limiter.recordFailure("client-a", now + attempt).allowed, true)
  }
  const blocked = limiter.recordFailure("client-a", now + ADMIN_LOGIN_MAX_FAILURES)
  assert.equal(blocked.allowed, false)
  assert.ok(blocked.retryAfterSeconds > 0)
  assert.equal(limiter.check("client-a", now + ADMIN_LOGIN_COOLDOWN_MS - 1).allowed, false)
  assert.equal(limiter.check("client-a", now + ADMIN_LOGIN_COOLDOWN_MS + ADMIN_LOGIN_MAX_FAILURES + 1).allowed, true)
}

{
  const limiter = new AdminLoginRateLimiter()
  limiter.recordFailure("client-b", now)
  limiter.recordFailure("client-b", now + 1)
  limiter.reset("client-b")
  assert.equal(limiter.check("client-b", now + 2).allowed, true)
  for (let attempt = 0; attempt < ADMIN_LOGIN_MAX_FAILURES - 1; attempt++) {
    assert.equal(limiter.recordFailure("client-b", now + 3 + attempt).allowed, true)
  }
}

assert.equal(await isAdminPasswordMatch("correcta", "correcta"), true)
assert.equal(await isAdminPasswordMatch("incorrecta", "correcta"), false)
assert.equal(await isAdminPasswordMatch(undefined, "correcta"), false)
assert.equal(await isAdminPasswordMatch("correcta", undefined), false)

const session = await createAdminSession("test-only-secret", now)
assert.equal(await isValidAdminSession(session, "test-only-secret", now), true)

const headers = new Headers({ "x-forwarded-for": "203.0.113.4, 10.0.0.1" })
assert.equal(adminLoginClientKey(headers), "203.0.113.4")
assert.equal(adminLoginClientKey(new Headers()), "unknown")

console.log("Pruebas de rate limiting y login administrativo OK")
