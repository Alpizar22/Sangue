import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  buildAuthoritativeCart,
  parseCheckoutItems,
  SHIPPING_COST_MXN,
  type AuthoritativeProduct,
} from "@/lib/checkout"
import { buildDiscountedTotals, evaluateDiscount, normalizeDiscountCode } from "@/lib/discounts"
import { findDiscountCode } from "@/lib/discountLookup"

// El subtotal se recalcula desde la base: nunca se acepta el que envía el
// navegador. Esta ruta solo previsualiza; el descuento definitivo se vuelve a
// resolver al crear la preferencia de pago.
const PRODUCT_COLUMNS =
  "id, title, display_name, sale_price, cost_price, status, source, stock, sizes, colors, color_sizes, printful_variant_map"

function adminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Faltan variables de entorno de Supabase")
  return createClient(url, key, { auth: { persistSession: false } })
}

function rejection(reason: string, message: string, status = 200) {
  return NextResponse.json({ valid: false, reason, message }, { status })
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return rejection("invalid_request", "Solicitud inválida.", 400)
  }

  const raw = (body ?? {}) as Record<string, unknown>
  const code = normalizeDiscountCode(raw.code)
  if (!code) return rejection("invalid_format", "El código no es válido.")

  const parsedItems = parseCheckoutItems(raw.items)
  if (parsedItems.issues.length > 0 || parsedItems.items.length === 0) {
    return rejection("empty_cart", "Agrega productos antes de aplicar un código.")
  }

  const supabase = adminSupabase()
  const productIds = [...new Set(parsedItems.items.map((item) => item.product_id))]
  const { data: productRows, error: productsError } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .in("id", productIds)

  if (productsError) {
    console.error(
      "[discounts] Error consultando productos:",
      JSON.stringify({
        code: productsError.code ?? null,
        message: productsError.message ?? null,
        details: productsError.details ?? null,
        hint: productsError.hint ?? null,
      })
    )
    return rejection("unavailable", "No pudimos validar el código. Intenta nuevamente.", 503)
  }

  const cart = buildAuthoritativeCart(parsedItems.items, (productRows ?? []) as AuthoritativeProduct[])
  if (!cart.ok) return rejection("empty_cart", "Revisa los productos de tu carrito.")

  const lookup = await findDiscountCode(supabase, code)
  if (!lookup.ok) {
    return lookup.missingTable
      ? rejection("unavailable", "Los códigos de descuento no están disponibles todavía.", 503)
      : rejection("unavailable", "No pudimos validar el código. Intenta nuevamente.", 503)
  }

  const evaluation = evaluateDiscount(lookup.row, cart.subtotal)
  if (!evaluation.ok) return rejection(evaluation.reason, evaluation.message)

  const totals = buildDiscountedTotals(cart.subtotal, SHIPPING_COST_MXN, evaluation.amount)

  return NextResponse.json({
    valid: true,
    code: evaluation.code,
    type: evaluation.type,
    value: evaluation.value,
    ...totals,
  })
}
