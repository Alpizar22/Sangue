import assert from "node:assert/strict"
import {
  canAcceptUnsignedWebhook,
  toPrintfulExternalId,
  validateApprovedPayment,
  type OrderPaymentSnapshot,
} from "../src/lib/payment.ts"

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
