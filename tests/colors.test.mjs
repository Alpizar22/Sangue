import assert from "node:assert/strict"
import test from "node:test"
import { colorToCss } from "../src/lib/colors.ts"

test("reconoce los colores garment-dyed de Printful", () => {
  assert.equal(colorToCss("Washed Black"), "#323438")
  assert.equal(colorToCss("Vintage White"), "#f9f6f2")
  assert.equal(colorToCss("Military Green"), "#59633d")
  assert.equal(colorToCss("Heather Stone"), "#b7afa1")
})

test("no oculta un color de proveedor por un prefijo de acabado", () => {
  assert.equal(colorToCss("Heather Navy"), "#1a237e")
})
