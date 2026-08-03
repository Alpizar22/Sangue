export const ADMIN_LOGIN_MAX_FAILURES = 5
export const ADMIN_LOGIN_WINDOW_MS = 15 * 60 * 1000
export const ADMIN_LOGIN_COOLDOWN_MS = 15 * 60 * 1000

interface AttemptState {
  failures: number
  windowStartedAt: number
  blockedUntil: number
}

export interface RateLimitDecision {
  allowed: boolean
  retryAfterSeconds: number
}

const MAX_TRACKED_CLIENTS = 10_000

// Defensa local por instancia. En serverless reduce fuerza bruta oportunista,
// pero un almacén compartido será necesario para un límite global estricto.

export class AdminLoginRateLimiter {
  private readonly attempts = new Map<string, AttemptState>()

  check(key: string, now = Date.now()): RateLimitDecision {
    this.prune(now)
    const state = this.attempts.get(key)
    if (!state) return { allowed: true, retryAfterSeconds: 0 }
    if (state.blockedUntil > now) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((state.blockedUntil - now) / 1000)),
      }
    }
    if (now - state.windowStartedAt >= ADMIN_LOGIN_WINDOW_MS) {
      this.attempts.delete(key)
      return { allowed: true, retryAfterSeconds: 0 }
    }
    return { allowed: true, retryAfterSeconds: 0 }
  }

  recordFailure(key: string, now = Date.now()): RateLimitDecision {
    this.prune(now)
    const previous = this.attempts.get(key)
    const state = !previous || now - previous.windowStartedAt >= ADMIN_LOGIN_WINDOW_MS
      ? { failures: 0, windowStartedAt: now, blockedUntil: 0 }
      : previous

    state.failures += 1
    if (state.failures >= ADMIN_LOGIN_MAX_FAILURES) {
      state.blockedUntil = now + ADMIN_LOGIN_COOLDOWN_MS
    }
    this.set(key, state)
    return this.check(key, now)
  }

  reset(key: string): void {
    this.attempts.delete(key)
  }

  private set(key: string, state: AttemptState): void {
    if (!this.attempts.has(key) && this.attempts.size >= MAX_TRACKED_CLIENTS) {
      const oldestKey = this.attempts.keys().next().value
      if (oldestKey) this.attempts.delete(oldestKey)
    }
    this.attempts.set(key, state)
  }

  private prune(now: number): void {
    for (const [key, state] of this.attempts) {
      const windowExpired = now - state.windowStartedAt >= ADMIN_LOGIN_WINDOW_MS
      if (windowExpired && state.blockedUntil <= now) this.attempts.delete(key)
    }
  }
}

export function adminLoginClientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  const direct = headers.get("x-real-ip")?.trim()
  const candidate = forwarded || direct || "unknown"
  return candidate.slice(0, 128)
}

export const adminLoginRateLimiter = new AdminLoginRateLimiter()
