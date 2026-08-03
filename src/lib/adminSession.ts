const SESSION_VERSION = "v1"
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  return bytesToHex(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))))
}

async function sha256(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)))
}

export async function isAdminPasswordMatch(candidate: unknown, expected: string | undefined): Promise<boolean> {
  const candidateText = typeof candidate === "string" ? candidate : ""
  const expectedText = expected ?? ""
  const [candidateDigest, expectedDigest] = await Promise.all([
    sha256(candidateText),
    sha256(expectedText),
  ])
  let mismatch = 0
  for (let index = 0; index < expectedDigest.length; index++) {
    mismatch |= candidateDigest[index] ^ expectedDigest[index]
  }
  return Boolean(expected) && typeof candidate === "string" && mismatch === 0
}

export async function createAdminSession(secret: string, now = Date.now()): Promise<string> {
  const expires = Math.floor(now / 1000) + SESSION_DURATION_SECONDS
  const payload = `${SESSION_VERSION}.${expires}`
  return `${payload}.${await sign(payload, secret)}`
}

export async function isValidAdminSession(
  value: string | undefined,
  secret: string | undefined,
  now = Date.now()
): Promise<boolean> {
  if (!value || !secret) return false
  const [version, expiresRaw, signature, extra] = value.split(".")
  if (extra || version !== SESSION_VERSION || !/^\d+$/.test(expiresRaw) || !/^[a-f0-9]{64}$/.test(signature)) return false
  if (Number(expiresRaw) <= Math.floor(now / 1000)) return false
  const expected = await sign(`${version}.${expiresRaw}`, secret)
  if (expected.length !== signature.length) return false
  let mismatch = 0
  for (let index = 0; index < expected.length; index++) mismatch |= expected.charCodeAt(index) ^ signature.charCodeAt(index)
  return mismatch === 0
}

export const ADMIN_SESSION_MAX_AGE = SESSION_DURATION_SECONDS
