import assert from "node:assert/strict"
import { createAdminSession, isValidAdminSession } from "../src/lib/adminSession.ts"

const secret = "test-only-secret"
const now = Date.UTC(2026, 0, 1)
const session = await createAdminSession(secret, now)

assert.equal(await isValidAdminSession(session, secret, now), true)
assert.equal(await isValidAdminSession(undefined, secret, now), false)
assert.equal(await isValidAdminSession(session, "wrong-secret", now), false)
assert.equal(await isValidAdminSession("1", secret, now), false)
assert.equal(await isValidAdminSession(`${session.slice(0, -1)}0`, secret, now), false)
assert.equal(await isValidAdminSession(session, secret, now + 8 * 24 * 60 * 60 * 1000), false)

console.log("5 pruebas OK — sesión administrativa firmada")
