import type { SupabaseClient } from "@supabase/supabase-js"
import type { DiscountCodeRow } from "@/lib/discounts"

const DISCOUNT_COLUMNS = "id, code, type, value, active, expires_at, usage_limit, times_used"

export type DiscountLookup =
  | { ok: true; row: DiscountCodeRow | null }
  /** La tabla aún no existe (migración sin aplicar) o la consulta falló. */
  | { ok: false; missingTable: boolean }

// PGRST205 es lo que devuelve PostgREST cuando la tabla no está en su caché de
// esquema; 42P01 es el código crudo de Postgres para relación inexistente. Si la
// migración add_discount_codes.sql todavía no se aplicó, el checkout debe seguir
// funcionando sin descuentos en lugar de caerse entero, que es exactamente el
// modo de fallo que rompió el checkout con products.size_stock.
function isMissingTable(error: { code?: string } | null): boolean {
  return error?.code === "PGRST205" || error?.code === "42P01"
}

export async function findDiscountCode(
  supabase: SupabaseClient,
  normalizedCode: string
): Promise<DiscountLookup> {
  const { data, error } = await supabase
    .from("discount_codes")
    .select(DISCOUNT_COLUMNS)
    .ilike("code", normalizedCode)
    .limit(1)
    .maybeSingle()

  if (error) {
    const missingTable = isMissingTable(error)
    console.error(
      "[discounts] Error consultando código:",
      JSON.stringify({ code: error.code ?? null, message: error.message ?? null, missingTable })
    )
    return { ok: false, missingTable }
  }

  return { ok: true, row: (data as DiscountCodeRow | null) ?? null }
}

// Devuelve un uso reservado cuando el pedido no llegó a crearse. Nunca baja de
// cero, así que un fallo doble no puede dejar el contador en negativo.
export async function releaseDiscountCode(
  supabase: SupabaseClient,
  discountId: string
): Promise<void> {
  const { data, error } = await supabase
    .from("discount_codes")
    .select("times_used")
    .eq("id", discountId)
    .maybeSingle()

  if (error || !data || data.times_used <= 0) return

  const { error: updateError } = await supabase
    .from("discount_codes")
    .update({ times_used: data.times_used - 1 })
    .eq("id", discountId)
    .eq("times_used", data.times_used)

  if (updateError) {
    console.error(
      "[discounts] No se pudo devolver el uso reservado:",
      JSON.stringify({ code: updateError.code ?? null, discountId })
    )
  }
}

// Incremento atómico: el WHERE vuelve a comprobar el límite dentro de la misma
// sentencia, así que dos checkouts simultáneos no pueden pasarse del cupo. Si
// no actualiza ninguna fila, el código se agotó entre la validación y el cobro.
export async function consumeDiscountCode(
  supabase: SupabaseClient,
  row: DiscountCodeRow
): Promise<boolean> {
  let query = supabase
    .from("discount_codes")
    .update({ times_used: row.times_used + 1 })
    .eq("id", row.id)
    .eq("times_used", row.times_used)
    .eq("active", true)

  if (row.usage_limit != null) query = query.lt("times_used", row.usage_limit)

  const { data, error } = await query.select("id")

  if (error) {
    console.error(
      "[discounts] Error consumiendo código:",
      JSON.stringify({ code: error.code ?? null, message: error.message ?? null })
    )
    return false
  }

  return (data?.length ?? 0) === 1
}
