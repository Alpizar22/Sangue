import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import {
  canAcceptUnsignedWebhook,
  canUseAutoReturn,
  MERCADOPAGO_STATEMENT_DESCRIPTOR,
  toPrintfulExternalId,
  validateApprovedPayment,
  type OrderPaymentSnapshot,
} from "../src/lib/payment.ts"
import { auditMercadoPagoCredential, describeAccessToken } from "../src/lib/mercadopago/client.ts"

const order: OrderPaymentSnapshot = {
  id: "11111111-1111-4111-8111-111111111111",
  total: 755,
  status: "pending",
  supplierOrderId: null,
}

function payment(overrides: Record<string, unknown> = {}) {
  return {
    id: "pay-1",
    status: "approved",
    externalReference: order.id,
    currency: "MXN",
    amount: 755,
    ...overrides,
  }
}

let passed = 0
function check(name: string, fn: () => void | Promise<void>) {
  try {
    const result = fn()
    if (result instanceof Promise) {
      return result.then(() => { passed++; console.log(`  ok — ${name}`) }).catch((error) => {
        console.error(`FAIL — ${name}`, error)
        process.exitCode = 1
      })
    }
    passed++
    console.log(`  ok — ${name}`)
  } catch (error) {
    console.error(`FAIL — ${name}`, error)
    process.exitCode = 1
  }
}

check("pago válido", () => assert.equal(validateApprovedPayment(payment(), order).ok, true))
check("monto menor", () => assert.equal(validateApprovedPayment(payment({ amount: 754 }), order).ok, false))
check("monto mayor", () => assert.equal(validateApprovedPayment(payment({ amount: 756 }), order).ok, false))
check("moneda incorrecta", () => assert.equal(validateApprovedPayment(payment({ currency: "USD" }), order).ok, false))
check("external_reference inexistente", () => assert.equal(validateApprovedPayment(payment({ externalReference: null }), order).ok, false))
check("pedido ya enviado a Printful", () => {
  assert.equal(validateApprovedPayment(payment(), { ...order, status: "ordered_to_supplier", supplierOrderId: "pf-1" }).ok, false)
})
check("pedido shipped no regresa", () => {
  assert.equal(validateApprovedPayment(payment(), { ...order, status: "shipped" }).ok, false)
})
check("pedido delivered no regresa", () => {
  assert.equal(validateApprovedPayment(payment(), { ...order, status: "delivered" }).ok, false)
})
check("supplier_order_id preexistente bloquea fulfillment", () => {
  assert.equal(validateApprovedPayment(payment(), { ...order, supplierOrderId: "123" }).ok, false)
})
check("external_id Printful es estable, único por UUID y cabe en 32 caracteres", () => {
  const external = toPrintfulExternalId(order.id)
  assert.equal(external, "11111111111141118111111111111111")
  assert.equal(external.length, 32)
})
check("webhook sin firma falla de forma cerrada en producción", () => {
  assert.equal(canAcceptUnsignedWebhook("production"), false)
  assert.equal(canAcceptUnsignedWebhook("development"), true)
})

// Simula la semántica de la restricción única de payment_events usada por la RPC:
// dos entregas concurrentes del mismo payment_id solo pueden reclamar una vez.
check("dos webhooks concurrentes simulados producen una sola reclamación", async () => {
  const events = new Set<string>()
  let fulfillmentCalls = 0
  async function deliver(id: string) {
    if (events.has(id)) return "duplicate"
    events.add(id)
    await Promise.resolve()
    fulfillmentCalls++
    return "claimed"
  }
  const outcomes = await Promise.all([deliver("pay-1"), deliver("pay-1")])
  assert.deepEqual(outcomes.sort(), ["claimed", "duplicate"])
  assert.equal(fulfillmentCalls, 1)
})

await Promise.resolve()
setTimeout(() => {
  console.log(`\n${passed} pruebas OK` + (process.exitCode ? " — HAY FALLAS ARRIBA" : ""))
}, 0)

// ── auto_return: MercadoPago exige back_urls.success públicamente alcanzable ──
check("auto_return se desactiva con localhost y URLs no públicas", () => {
  assert.equal(canUseAutoReturn("http://localhost:3000"), false)
  assert.equal(canUseAutoReturn("https://localhost:3000"), false)
  assert.equal(canUseAutoReturn("http://127.0.0.1:3000"), false)
  assert.equal(canUseAutoReturn("https://192.168.1.50"), false)
  assert.equal(canUseAutoReturn("https://theia.local"), false)
  assert.equal(canUseAutoReturn("http://www.theia.lat"), false)
  assert.equal(canUseAutoReturn(""), false)
  assert.equal(canUseAutoReturn(undefined), false)
  assert.equal(canUseAutoReturn("no-es-una-url"), false)
})

check("auto_return se mantiene con la URL pública de producción", () => {
  assert.equal(canUseAutoReturn("https://www.theia.lat"), true)
  assert.equal(canUseAutoReturn("https://theia.lat"), true)
  assert.equal(canUseAutoReturn("https://theia-git-main.vercel.app"), true)
})

check("la preferencia envía THEIA como statement_descriptor dentro del límite", () => {
  const checkoutRoute = readFileSync("src/app/api/pedidos/checkout/route.ts", "utf8")
  assert.equal(MERCADOPAGO_STATEMENT_DESCRIPTOR, "THEIA")
  assert.ok(MERCADOPAGO_STATEMENT_DESCRIPTOR.length <= 13)
  assert.match(
    checkoutRoute,
    /statement_descriptor:\s*MERCADOPAGO_STATEMENT_DESCRIPTOR/,
    "preferenceBody debe enviar el descriptor validado"
  )
})

check("la huella del token no revela el secreto", () => {
  const token = "APP_USR-8697645010519606-041917-6d7d35cda7f436e9b9446993dc99e501-3346852366"
  const fingerprint = describeAccessToken(token)
  assert.ok(fingerprint.startsWith("APP_USR-86"), "debe mostrar el prefijo")
  assert.ok(fingerprint.includes("userId=3346852366"), "debe mostrar el user id")
  assert.ok(!fingerprint.includes("6d7d35cda7f436e9b9446993dc99e501"), "NO debe incluir el hash secreto")
  assert.equal(describeAccessToken(undefined), "AUSENTE")
})

// ── Auditoría de credenciales MercadoPago ────────────────────────────────────
// El fallo real en producción: el token traía un "\n" final y la cabecera
// Authorization quedaba inválida. Estas pruebas fijan ese comportamiento.
const PROD_TOKEN = "APP_USR-7104740247964511-041917-c1b5804fd550a850f56cc7570bc74d3f-3348003734"
const PUBLIC_KEY = "APP_USR-54f6c65e-19f8-4f1a-b427-805fa28ccca0"

check("un token con salto de línea final se recorta y queda utilizable", () => {
  const audit = auditMercadoPagoCredential("MERCADOPAGO_ACCESS_TOKEN", `${PROD_TOKEN}\n`, "access_token")
  assert.equal(audit.error, null, "no debe bloquear: el valor es correcto, solo sobraba el salto")
  assert.equal(audit.warning, null)
  assert.equal(audit.value, PROD_TOKEN)
  assert.equal(audit.value.length, 75)
  assert.equal(audit.hadSurroundingWhitespace, true, "debe avisar del recorte")
})

check("espacios, tabuladores y CRLF alrededor también se recortan", () => {
  for (const wrapped of [` ${PROD_TOKEN}`, `${PROD_TOKEN} `, `\t${PROD_TOKEN}\r\n`, `\n\n${PROD_TOKEN}\n`]) {
    const audit = auditMercadoPagoCredential("MERCADOPAGO_ACCESS_TOKEN", wrapped, "access_token")
    assert.equal(audit.error, null)
    assert.equal(audit.value, PROD_TOKEN)
    assert.equal(audit.hadSurroundingWhitespace, true)
  }
})

check("un token limpio no genera aviso de recorte", () => {
  const audit = auditMercadoPagoCredential("MERCADOPAGO_ACCESS_TOKEN", PROD_TOKEN, "access_token")
  assert.deepEqual(
    { error: audit.error, warning: audit.warning, trimmed: audit.hadSurroundingWhitespace },
    { error: null, warning: null, trimmed: false }
  )
})

check("credencial ausente o vacía da error explícito", () => {
  assert.match(
    auditMercadoPagoCredential("MERCADOPAGO_ACCESS_TOKEN", undefined, "access_token").error ?? "",
    /no está configurado/
  )
  assert.match(
    auditMercadoPagoCredential("MERCADOPAGO_ACCESS_TOKEN", "   \n ", "access_token").error ?? "",
    /vacío/
  )
})

check("espacios internos se rechazan: la cabecera quedaría rota", () => {
  const partido = PROD_TOKEN.slice(0, 20) + " " + PROD_TOKEN.slice(20)
  assert.match(
    auditMercadoPagoCredential("MERCADOPAGO_ACCESS_TOKEN", partido, "access_token").error ?? "",
    /espacios o saltos de línea internos/
  )
})

check("caracteres de control internos se rechazan", () => {
  const conNul = PROD_TOKEN.slice(0, 20) + "\u0000" + PROD_TOKEN.slice(20)
  assert.match(
    auditMercadoPagoCredential("MERCADOPAGO_ACCESS_TOKEN", conNul, "access_token").error ?? "",
    /caracteres de control/
  )
})

check("un valor con prefijo equivocado se rechaza con el largo en el mensaje", () => {
  const audit = auditMercadoPagoCredential("MERCADOPAGO_ACCESS_TOKEN", "REEMPLAZAR_CON_TOKEN", "access_token")
  assert.match(audit.error ?? "", /no empieza con APP_USR- ni TEST-/)
  assert.match(audit.error ?? "", /largo=20/)
})

check("un token truncado pasa pero con aviso de forma", () => {
  const audit = auditMercadoPagoCredential("MERCADOPAGO_ACCESS_TOKEN", "APP_USR-7104740247964511-041917", "access_token")
  assert.equal(audit.error, null, "no bloquea: el formato de MercadoPago puede cambiar")
  assert.match(audit.warning ?? "", /no coincide con el formato habitual/)
})

check("las claves públicas se validan con su propia forma", () => {
  const limpia = auditMercadoPagoCredential("NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY", PUBLIC_KEY, "public_key")
  assert.equal(limpia.error, null)
  assert.equal(limpia.warning, null)

  const conSalto = auditMercadoPagoCredential("MERCADOPAGO_PUBLIC_KEY", `${PUBLIC_KEY}\n`, "public_key")
  assert.equal(conSalto.error, null)
  assert.equal(conSalto.value, PUBLIC_KEY)
  assert.equal(conSalto.hadSurroundingWhitespace, true)
})

check("el token de prueba (test user) sigue siendo válido tras la validación", () => {
  const testToken = "APP_USR-8697645010519606-041917-6d7d35cda7f436e9b9446993dc99e501-3346852366"
  const audit = auditMercadoPagoCredential("MERCADOPAGO_ACCESS_TOKEN", testToken, "access_token")
  assert.equal(audit.error, null)
  assert.equal(audit.warning, null)
})
