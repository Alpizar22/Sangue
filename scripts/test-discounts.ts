// Validación reproducible del sistema de códigos de descuento.
// Correr con:  node scripts/test-discounts.ts

import assert from "node:assert/strict"
import {
  buildDiscountedTotals,
  evaluateDiscount,
  normalizeDiscountCode,
  roundMoney,
  type DiscountCodeRow,
} from "../src/lib/discounts.ts"

let passed = 0
function check(name: string, fn: () => void) {
  try {
    fn()
    passed++
    console.log(`  ok — ${name}`)
  } catch (err) {
    console.error(`FAIL — ${name}`)
    console.error(err)
    process.exitCode = 1
  }
}

const SHIPPING = 155
const base: DiscountCodeRow = {
  id: "11111111-1111-4111-8111-111111111111",
  code: "THEIA10",
  type: "percentage",
  value: 10,
  active: true,
  expires_at: null,
  usage_limit: null,
  times_used: 0,
}

console.log("== Normalización del código ==")

check("recorta, quita espacios internos y pasa a mayúsculas", () => {
  assert.equal(normalizeDiscountCode("  theia 10 "), "THEIA10")
})
check("acepta guiones, guion bajo y punto", () => {
  assert.equal(normalizeDiscountCode("black-friday_2026.v2"), "BLACK-FRIDAY_2026.V2")
})
check("rechaza caracteres no permitidos", () => {
  assert.equal(normalizeDiscountCode("THEIA<10>"), null)
  assert.equal(normalizeDiscountCode("DROP;TABLE"), null)
})
check("rechaza vacío, no-string y códigos demasiado largos", () => {
  assert.equal(normalizeDiscountCode(""), null)
  assert.equal(normalizeDiscountCode("   "), null)
  assert.equal(normalizeDiscountCode(42), null)
  assert.equal(normalizeDiscountCode(null), null)
  assert.equal(normalizeDiscountCode("A".repeat(41)), null)
})

console.log("\n== Cálculo del importe ==")

check("porcentaje: 10% sobre 980 son 98", () => {
  const result = evaluateDiscount(base, 980)
  assert.equal(result.ok, true)
  assert.equal((result as { amount: number }).amount, 98)
})
check("fijo: descuenta el valor tal cual", () => {
  const result = evaluateDiscount({ ...base, type: "fixed", value: 150 }, 980)
  assert.equal((result as { amount: number }).amount, 150)
})
check("el importe fijo nunca supera el subtotal", () => {
  const result = evaluateDiscount({ ...base, type: "fixed", value: 5000 }, 980)
  assert.equal((result as { amount: number }).amount, 980)
})
check("100% deja el subtotal en cero pero sigue siendo válido", () => {
  const result = evaluateDiscount({ ...base, value: 100 }, 980)
  assert.equal((result as { amount: number }).amount, 980)
})
check("value viene como string desde numeric y se interpreta bien", () => {
  const result = evaluateDiscount({ ...base, value: "15.5" }, 1000)
  assert.equal((result as { amount: number }).amount, 155)
})
check("redondea a dos decimales", () => {
  const result = evaluateDiscount({ ...base, value: 33 }, 100)
  assert.equal((result as { amount: number }).amount, 33)
  assert.equal(roundMoney(0.1 + 0.2), 0.3)
})

console.log("\n== Rechazos ==")

check("código inexistente", () => {
  assert.equal(evaluateDiscount(null, 980).ok, false)
  assert.equal((evaluateDiscount(null, 980) as { reason: string }).reason, "not_found")
})
check("código inactivo", () => {
  const result = evaluateDiscount({ ...base, active: false }, 980)
  assert.equal((result as { reason: string }).reason, "inactive")
})
check("código expirado", () => {
  const result = evaluateDiscount({ ...base, expires_at: "2020-01-01T00:00:00Z" }, 980)
  assert.equal((result as { reason: string }).reason, "expired")
})
check("código vigente con expires_at futuro sí aplica", () => {
  const future = new Date(Date.now() + 86_400_000).toISOString()
  assert.equal(evaluateDiscount({ ...base, expires_at: future }, 980).ok, true)
})
check("límite de usos alcanzado", () => {
  const result = evaluateDiscount({ ...base, usage_limit: 5, times_used: 5 }, 980)
  assert.equal((result as { reason: string }).reason, "usage_limit_reached")
})
check("con cupo disponible sí aplica", () => {
  assert.equal(evaluateDiscount({ ...base, usage_limit: 5, times_used: 4 }, 980).ok, true)
})
check("carrito vacío o subtotal no positivo", () => {
  assert.equal((evaluateDiscount(base, 0) as { reason: string }).reason, "empty_cart")
  assert.equal((evaluateDiscount(base, -10) as { reason: string }).reason, "empty_cart")
})
check("configuración inválida: porcentaje > 100, valor <= 0, tipo desconocido", () => {
  assert.equal((evaluateDiscount({ ...base, value: 150 }, 980) as { reason: string }).reason, "invalid_configuration")
  assert.equal((evaluateDiscount({ ...base, value: 0 }, 980) as { reason: string }).reason, "invalid_configuration")
  assert.equal((evaluateDiscount({ ...base, type: "bogus" }, 980) as { reason: string }).reason, "invalid_configuration")
})

console.log("\n== Totales y cuadre con MercadoPago ==")

check("sin descuento el total es subtotal + envío", () => {
  const totals = buildDiscountedTotals(980, SHIPPING, 0)
  assert.deepEqual(totals, { subtotal: 980, discountAmount: 0, shippingCost: 155, total: 1135 })
})
check("con descuento el total refleja la rebaja", () => {
  const totals = buildDiscountedTotals(980, SHIPPING, 98)
  assert.deepEqual(totals, { subtotal: 980, discountAmount: 98, shippingCost: 155, total: 1037 })
})
check("el descuento se acota al subtotal: el envío siempre se cobra", () => {
  const totals = buildDiscountedTotals(980, SHIPPING, 5000)
  assert.equal(totals.discountAmount, 980)
  assert.equal(totals.total, 155)
})
check("un descuento negativo se ignora", () => {
  assert.equal(buildDiscountedTotals(980, SHIPPING, -50).discountAmount, 0)
})

// El webhook aborta el pago si |monto MercadoPago - orders.total| > 0.005, así
// que la suma de las líneas enviadas debe cuadrar exactamente con el total.
function mercadoPagoTotal(subtotal: number, discountAmount: number, shipping: number): number {
  const totals = buildDiscountedTotals(subtotal, shipping, discountAmount)
  const lines = totals.discountAmount > 0
    ? [roundMoney(totals.subtotal - totals.discountAmount)]
    : [totals.subtotal]
  return roundMoney([...lines, totals.shippingCost].reduce((sum, value) => sum + value, 0))
}

check("la suma de líneas de MercadoPago cuadra con orders.total", () => {
  const cases: Array<[number, number]> = [
    [980, 0], [980, 98], [1960, 196], [2940, 294],
    [1234.56, 123.46], [999.99, 333.33], [100, 100], [3333, 1111],
  ]
  for (const [subtotal, discount] of cases) {
    const totals = buildDiscountedTotals(subtotal, SHIPPING, discount)
    assert.equal(
      mercadoPagoTotal(subtotal, discount, SHIPPING),
      totals.total,
      `descuadre con subtotal=${subtotal} descuento=${discount}`
    )
    assert.ok(totals.total > 0, "el total debe ser mayor a cero")
  }
})

check("un porcentaje sobre importes con decimales sigue cuadrando", () => {
  for (let percent = 1; percent <= 100; percent++) {
    const subtotal = 1234.56
    const evaluation = evaluateDiscount({ ...base, value: percent }, subtotal)
    assert.equal(evaluation.ok, true)
    const amount = (evaluation as { amount: number }).amount
    const totals = buildDiscountedTotals(subtotal, SHIPPING, amount)
    assert.equal(mercadoPagoTotal(subtotal, amount, SHIPPING), totals.total, `descuadre al ${percent}%`)
  }
})

console.log(`\n${passed} pruebas OK` + (process.exitCode ? " — HAY FALLAS ARRIBA" : ""))
