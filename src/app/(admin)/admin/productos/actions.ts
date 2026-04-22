"use server"

import { createClient } from "@supabase/supabase-js"

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"]
const MARKUP = 2.5

function adminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Faltan variables de entorno de Supabase")
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function createProduct(
  formData: FormData
): Promise<{ error: string | null }> {
  const supabase = adminSupabase()

  const title = String(formData.get("title") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim() || null
  const costPrice = parseFloat(String(formData.get("cost_price") ?? "0"))
  const salePrice = parseFloat(String(formData.get("sale_price") ?? "0"))
  const category = String(formData.get("category") ?? "").trim()
  const sheinUrl = String(formData.get("shein_url") ?? "").trim() || ""
  const sizes = SIZES.filter((s) => formData.get(`size_${s}`) === "on")

  if (!title || costPrice <= 0) return { error: "Título y precio requeridos" }

  // Upload images
  const imageUrls: string[] = []
  const files = formData.getAll("images") as File[]
  for (const file of files.slice(0, 5)) {
    if (!file || file.size === 0) continue
    const ext = file.name.split(".").pop() ?? "jpg"
    const path = `manual/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, file, { contentType: file.type })
    if (uploadError) {
      console.error("[createProduct] image upload error:", uploadError)
    } else {
      const { data } = supabase.storage.from("product-images").getPublicUrl(path)
      imageUrls.push(data.publicUrl)
    }
  }

  const finalSalePrice =
    salePrice > 0 ? salePrice : Math.ceil((costPrice * MARKUP) / 100) * 100

  const { error: insertError } = await supabase.from("products").insert({
    title,
    description,
    original_price: costPrice,
    cost_price: costPrice,
    sale_price: finalSalePrice,
    markup_percentage: Math.round((finalSalePrice / costPrice - 1) * 100),
    category,
    sizes,
    colors: [],
    tags: [],
    images: imageUrls,
    shein_url: sheinUrl,
    shein_product_id: sheinUrl ? "" : `manual_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    shein_sku: null,
    stock: 99,
    status: "active",
  })

  if (insertError) {
    console.error("[createProduct] insert error:", insertError)
    return { error: `Error al guardar: ${insertError.message}` }
  }

  return { error: null }
}

export async function updateProduct(
  id: string,
  formData: FormData
): Promise<{ error: string | null }> {
  const supabase = adminSupabase()

  const title = String(formData.get("title") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim() || null
  const costPrice = parseFloat(String(formData.get("cost_price") ?? "0"))
  const salePrice = parseFloat(String(formData.get("sale_price") ?? "0"))
  const category = String(formData.get("category") ?? "").trim()
  const sheinUrl = String(formData.get("shein_url") ?? "").trim() || ""
  const sizes = SIZES.filter((s) => formData.get(`size_${s}`) === "on")
  const status = String(formData.get("status") ?? "active")

  if (!title || costPrice <= 0) return { error: "Título y precio requeridos" }

  const finalSalePrice =
    salePrice > 0 ? salePrice : Math.ceil((costPrice * MARKUP) / 100) * 100

  // Upload new images and append to existing
  const existingImages = String(formData.get("existing_images") ?? "")
  const imageUrls: string[] = existingImages ? existingImages.split(",").filter(Boolean) : []
  const files = formData.getAll("images") as File[]
  for (const file of files.slice(0, 5)) {
    if (!file || file.size === 0) continue
    const ext = file.name.split(".").pop() ?? "jpg"
    const path = `manual/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, file, { contentType: file.type })
    if (uploadError) {
      console.error("[updateProduct] image upload error:", uploadError)
    } else {
      const { data } = supabase.storage.from("product-images").getPublicUrl(path)
      imageUrls.push(data.publicUrl)
    }
  }

  const { error: updateError } = await supabase
    .from("products")
    .update({
      title,
      description,
      original_price: costPrice,
      cost_price: costPrice,
      sale_price: finalSalePrice,
      markup_percentage: Math.round((finalSalePrice / costPrice - 1) * 100),
      category,
      sizes,
      shein_url: sheinUrl,
      images: imageUrls,
      status,
    })
    .eq("id", id)

  if (updateError) {
    console.error("[updateProduct] update error:", updateError)
    return { error: `Error al actualizar: ${updateError.message}` }
  }

  return { error: null }
}
