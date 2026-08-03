import assert from "node:assert/strict"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"

const root = process.cwd()
const read = (path: string) => readFileSync(join(root, path), "utf8")
const portable = (path: string) => path.replaceAll("\\", "/")

function filesBelow(path: string): string[] {
  const absolute = join(root, path)
  return readdirSync(absolute).flatMap((name) => {
    const child = join(absolute, name)
    return statSync(child).isDirectory() ? filesBelow(relative(root, child)) : [portable(relative(root, child))]
  })
}

const scrapingRoute = read("src/app/api/scraping/start/route.ts")
const scrapingGuard = scrapingRoute.indexOf("await hasValidAdminSession()")
const scrapingAdminClient = scrapingRoute.indexOf("const supabase = await createAdminClient()")
assert.ok(scrapingGuard > -1, "scraping/start debe validar la sesión")
assert.ok(scrapingAdminClient > scrapingGuard, "scraping/start debe autorizar antes de crear el cliente admin")

const serverActionFiles = filesBelow("src/app")
  .filter((path) => path.endsWith("actions.ts"))
  .filter((path) => read(path).includes("use server"))
assert.deepEqual(serverActionFiles.sort(), [
  "src/app/(admin)/admin/precios/actions.ts",
  "src/app/(admin)/admin/productos/actions.ts",
])

for (const path of serverActionFiles) {
  const source = read(path)
  const exports = [...source.matchAll(/export async function\s+(\w+)/g)]
  assert.ok(exports.length > 0, `${path} debe exportar acciones`)
  for (let index = 0; index < exports.length; index++) {
    const start = exports[index].index ?? 0
    const end = exports[index + 1]?.index ?? source.length
    const body = source.slice(start, end)
    const guard = body.indexOf("await requireValidAdminSession()")
    const privilegedClient = body.indexOf("adminSupabase()")
    assert.ok(guard > -1, `${path}:${exports[index][1]} debe validar la sesión`)
    assert.ok(privilegedClient === -1 || guard < privilegedClient, `${path}:${exports[index][1]} debe autorizar antes del cliente`)
  }
}

const migration = read("supabase/migrations/secure_checkout_and_fulfillment.sql")
for (const expected of [
  "revoke all privileges on table public.orders from public, anon, authenticated",
  "revoke all privileges on table public.customers from public, anon, authenticated",
  "set search_path = pg_catalog",
  "from public, anon, authenticated",
  "owner to postgres",
  "public.payment_events",
  "status = 'claimed'",
  "payment_id = p_payment_id",
  "order_id = p_order_id",
]) {
  assert.ok(migration.includes(expected), `Falta endurecimiento SQL: ${expected}`)
}
assert.ok(migration.includes("payment_events incompatible:"), "La migración debe fallar claramente ante estructuras incompatibles")

const schema = read("supabase/schema.sql")
assert.ok(!schema.includes('create policy "customers_admin_only"'))
assert.ok(!schema.includes('create policy "orders_admin_only"'))

const nextConfig = read("next.config.ts")
assert.ok(nextConfig.includes('source: "/pedidos/:path*"'))
assert.ok(nextConfig.includes('source: "/ayuda/seguimiento"'))
assert.equal((nextConfig.match(/value: "no-referrer"/g) ?? []).length, 2)

for (const publicPage of [
  "src/app/(store)/pedidos/[id]/page.tsx",
  "src/app/(store)/ayuda/seguimiento/page.tsx",
]) {
  const source = read(publicPage)
  for (const selection of source.matchAll(/\.select\(([^)]*)\)/gs)) {
    assert.ok(!selection[1].includes("notes"), `${publicPage} no debe seleccionar notes`)
  }
}

for (const loggedFile of [
  "src/app/api/pedidos/checkout/route.ts",
  "src/app/api/webhooks/mercadopago/route.ts",
]) {
  const logLines = read(loggedFile).split(/\r?\n/).filter((line) => line.includes("console."))
  assert.ok(logLines.every((line) => !/publicAccessToken|token=|public_access_token/.test(line)))
}

const checkoutRoute = read("src/app/api/pedidos/checkout/route.ts")
assert.ok(checkoutRoute.includes('safeFailureNote("incomplete_preference")'))

const verification = read("supabase/secure_checkout_verification.sql")
assert.ok(verification.includes("has_function_privilege"))
assert.ok(verification.includes("information_schema.routine_privileges"))
assert.ok(verification.includes("pg_catalog.pg_proc"))
assert.ok(verification.includes("pg_catalog.pg_roles"))

console.log(`Endurecimiento estático OK; Server Actions revisadas: ${serverActionFiles.join(", ")}`)
