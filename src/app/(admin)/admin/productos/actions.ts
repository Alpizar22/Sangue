"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { requireValidAdminSession } from "@/lib/adminAuth"
import { parseAdminProductForm, parseEditorialImages } from "@/lib/adminProduct"

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"]
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/avif": "avif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}
function adminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Faltan variables de entorno de Supabase")
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function createProduct(
  formData: FormData
): Promise<{ error: string | null }> {
  await requireValidAdminSession()
  const supabase = adminSupabase()
  const parsed = parseAdminProductForm(formData)
  if (!parsed.ok) return { error: parsed.error }

  const sheinUrl = String(formData.get("shein_url") ?? "").trim() || ""
  const sizes = SIZES.filter((s) => formData.get(`size_${s}`) === "on")

  // Upload images
  const imageUrls: string[] = []
  const files = (formData.getAll("images") as File[]).filter((file) => file?.size > 0)
  if (files.length > 5) return { error: "Se permiten hasta 5 imágenes." }
  for (const file of files) {
    const ext = IMAGE_EXTENSIONS[file.type]
    if (!ext) return { error: "Las imágenes deben ser AVIF, JPEG, PNG o WebP." }
    if (file.size > MAX_IMAGE_BYTES) return { error: "Cada imagen debe pesar 10 MB o menos." }
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

  const { error: insertError } = await supabase.from("products").insert({
    ...parsed.value,
    markup_percentage: parsed.value.cost_price > 0
      ? Math.round((parsed.value.sale_price / parsed.value.cost_price - 1) * 100)
      : 0,
    sizes,
    colors: [],
    tags: [],
    images: imageUrls,
    shein_url: sheinUrl,
    shein_product_id: `manual_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    shein_sku: null,
    stock: 99,
  })

  if (insertError) {
    console.error("[createProduct] insert error:", insertError)
    return { error: `Error al guardar: ${insertError.message}` }
  }

  revalidateProductPaths()
  return { error: null }
}

export async function deleteProduct(id: string): Promise<{ error: string | null }> {
  await requireValidAdminSession()
  const supabase = adminSupabase()
  const { error } = await supabase.from("products").delete().eq("id", id)
  if (error) {
    console.error("[deleteProduct] error:", error)
    return { error: error.message }
  }
  revalidateProductPaths()
  return { error: null }
}

export async function updateProduct(
  id: string,
  formData: FormData
): Promise<{ error: string | null }> {
  await requireValidAdminSession()
  const supabase = adminSupabase()
  const parsed = parseAdminProductForm(formData)
  if (!parsed.ok) return { error: parsed.error }

  const { error: updateError } = await supabase
    .from("products")
    .update({
      ...parsed.value,
      markup_percentage: parsed.value.cost_price > 0
        ? Math.round((parsed.value.sale_price / parsed.value.cost_price - 1) * 100)
        : 0,
    })
    .eq("id", id)

  if (updateError) {
    console.error("[updateProduct] update error:", updateError)
    return { error: `Error al actualizar: ${updateError.message}` }
  }

  revalidateProductPaths(id)
  return { error: null }
}

export async function updateProductPresentation(
  id: string,
  formData: FormData
): Promise<{ error: string | null }> {
  await requireValidAdminSession()
  const supabase = adminSupabase()

  const displayName = String(formData.get("display_name") ?? "").trim() || null
  const subtitle = String(formData.get("subtitle") ?? "").trim() || null
  const chapter = String(formData.get("chapter") ?? "").trim() || null
  const story = String(formData.get("story") ?? "").trim() || null
  let editorialImages: string[] | null
  try {
    editorialImages = parseEditorialImages(formData.get("editorial_images"))
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Imágenes editoriales inválidas." }
  }

  const { error } = await supabase
    .from("products")
    .update({ display_name: displayName, subtitle, chapter, story, editorial_images: editorialImages })
    .eq("id", id)

  if (error) {
    console.error("[updateProductPresentation] error:", error)
    return { error: `Error al guardar curaduría: ${error.message}` }
  }

  revalidateProductPaths(id)
  return { error: null }
}

function revalidateProductPaths(id?: string) {
  revalidatePath("/")
  revalidatePath("/coleccion")
  revalidatePath("/productos")
  if (id) revalidatePath(`/productos/${id}`)
  revalidatePath("/admin")
  revalidatePath("/admin/productos")
}
