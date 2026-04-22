"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@supabase/supabase-js"

function adminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Faltan variables de entorno de Supabase")
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function createPricingRule(formData: FormData): Promise<void> {
  const supabase = adminSupabase()

  const name = String(formData.get("name") ?? "").trim()
  const category = String(formData.get("category") ?? "").trim() || null
  const markupType = String(formData.get("markup_type") ?? "percentage") as "percentage" | "fixed"
  const markupValue = parseFloat(String(formData.get("markup_value") ?? "0"))
  const minPrice = formData.get("min_price") ? parseFloat(String(formData.get("min_price"))) : null
  const maxPrice = formData.get("max_price") ? parseFloat(String(formData.get("max_price"))) : null

  if (!name || markupValue <= 0) throw new Error("Nombre y valor de markup requeridos")

  const { error } = await supabase.from("pricing_rules").insert({
    name,
    category,
    markup_type: markupType,
    markup_value: markupValue,
    min_price: minPrice,
    max_price: maxPrice,
    active: true,
  })

  if (error) throw new Error(error.message)

  revalidatePath("/admin/precios")
}

export async function togglePricingRule(id: string, active: boolean): Promise<void> {
  const supabase = adminSupabase()
  await supabase.from("pricing_rules").update({ active }).eq("id", id)
  revalidatePath("/admin/precios")
}

export async function deletePricingRule(id: string): Promise<void> {
  const supabase = adminSupabase()
  await supabase.from("pricing_rules").delete().eq("id", id)
  revalidatePath("/admin/precios")
}
