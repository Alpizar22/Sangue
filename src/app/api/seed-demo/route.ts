import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function adminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Faltan variables de entorno de Supabase")
  return createClient(url, key, { auth: { persistSession: false } })
}

const DEMO_PRODUCTS = [
  {
    shein_product_id: "demo_mascotas_001",
    title: "Comedero automático para mascotas",
    description: "Dispensador de alimento programable con capacidad de 3L. Ideal para perros y gatos. Pantalla LCD con temporizador.",
    images: [
      "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&q=80",
      "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&q=80",
    ],
    price: 490,
    original_price: 490,
    cost_price: 350,
    sale_price: 490,
    category: "mascotas",
    subcategory: "comederos",
    seccion: "mascotas",
    source: "dropi",
    status: "active",
    stock: 20,
    tags: ["mascotas", "comedero", "automatico"],
    sizes: [],
    colors: [],
    variants: [],
    color_sizes: {},
    markup_percentage: 40,
  },
  {
    shein_product_id: "demo_mascotas_002",
    title: "Cama ortopédica para perro",
    description: "Cama con memoria de forma para perros medianos y grandes. Funda lavable, espuma de alta densidad para soporte articular.",
    images: [
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80",
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80",
    ],
    price: 580,
    original_price: 580,
    cost_price: 415,
    sale_price: 580,
    category: "mascotas",
    subcategory: "camas",
    seccion: "mascotas",
    source: "dropi",
    status: "active",
    stock: 15,
    tags: ["mascotas", "cama", "perro"],
    sizes: ["S", "M", "L"],
    colors: ["Gris", "Beige"],
    variants: [
      { name: "Talla S – Gris", sku: "CAMA-S-GR" },
      { name: "Talla M – Gris", sku: "CAMA-M-GR" },
      { name: "Talla L – Beige", sku: "CAMA-L-BE" },
    ],
    color_sizes: {
      Gris: ["S", "M"],
      Beige: ["L"],
    },
    markup_percentage: 40,
  },
  {
    shein_product_id: "demo_mascotas_003",
    title: "Juguete interactivo para gatos",
    description: "Pluma giratoria eléctrica con movimientos impredecibles. Estimula el instinto cazador. Recargable USB, 3 modos.",
    images: [
      "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800&q=80",
      "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800&q=80",
    ],
    price: 220,
    original_price: 220,
    cost_price: 157,
    sale_price: 220,
    category: "mascotas",
    subcategory: "juguetes",
    seccion: "mascotas",
    source: "dropi",
    status: "active",
    stock: 35,
    tags: ["mascotas", "juguete", "gato"],
    sizes: [],
    colors: [],
    variants: [],
    color_sizes: {},
    markup_percentage: 40,
  },
  {
    shein_product_id: "demo_mascotas_004",
    title: "Collar LED recargable",
    description: "Collar de seguridad con luz LED multicolor recargable por USB. Visible hasta 500m. Ajustable de 25cm a 65cm.",
    images: [
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80",
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80",
    ],
    price: 180,
    original_price: 180,
    cost_price: 129,
    sale_price: 180,
    category: "mascotas",
    subcategory: "accesorios",
    seccion: "mascotas",
    source: "dropi",
    status: "active",
    stock: 50,
    tags: ["mascotas", "collar", "led"],
    sizes: ["S", "M", "L"],
    colors: ["Rojo", "Azul", "Verde"],
    variants: [
      { name: "S – Rojo", sku: "LED-S-RJ" },
      { name: "M – Azul", sku: "LED-M-AZ" },
      { name: "L – Verde", sku: "LED-L-VD" },
    ],
    color_sizes: {
      Rojo: ["S"],
      Azul: ["M"],
      Verde: ["L"],
    },
    markup_percentage: 40,
  },
  {
    shein_product_id: "demo_mascotas_005",
    title: "Bebedero de fuente para gatos",
    description: "Fuente de agua con filtro de carbón activado. 2.5L de capacidad, flujo silencioso, estimula a tu gato a hidratarse.",
    images: [
      "https://images.unsplash.com/photo-1518791841217-8f162f1912da?w=800&q=80",
      "https://images.unsplash.com/photo-1518791841217-8f162f1912da?w=800&q=80",
    ],
    price: 350,
    original_price: 350,
    cost_price: 250,
    sale_price: 350,
    category: "mascotas",
    subcategory: "bebederos",
    seccion: "mascotas",
    source: "dropi",
    status: "active",
    stock: 25,
    tags: ["mascotas", "bebedero", "gato"],
    sizes: [],
    colors: ["Blanco", "Gris"],
    variants: [
      { name: "Blanco", sku: "BEB-BL" },
      { name: "Gris", sku: "BEB-GR" },
    ],
    color_sizes: {
      Blanco: ["Único"],
      Gris: ["Único"],
    },
    markup_percentage: 40,
  },
  {
    shein_product_id: "demo_mascotas_006",
    title: "Kit de aseo para mascotas",
    description: "Set 7 piezas: tijeras, peine, cepillo, lima de uñas, cortauñas, guante y champú seco. Para perros y gatos.",
    images: [
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&q=80",
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&q=80",
    ],
    price: 310,
    original_price: 310,
    cost_price: 221,
    sale_price: 310,
    category: "aseo",
    subcategory: "grooming",
    seccion: "mascotas",
    source: "dropi",
    status: "active",
    stock: 30,
    tags: ["mascotas", "aseo", "grooming"],
    sizes: [],
    colors: [],
    variants: [],
    color_sizes: {},
    markup_percentage: 40,
  },
]

export async function POST(req: NextRequest) {
  try {
    const supabase = adminSupabase()
    const { data, error } = await supabase
      .from("products")
      .upsert(DEMO_PRODUCTS, { onConflict: "shein_product_id", count: "exact" })

    if (error) {
      console.error("[seed-demo] upsert error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      inserted: DEMO_PRODUCTS.length,
      message: `${DEMO_PRODUCTS.length} productos demo insertados correctamente`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido"
    console.error("[seed-demo]", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = adminSupabase()
    const ids = DEMO_PRODUCTS.map((p) => p.shein_product_id)
    const { error, count } = await supabase
      .from("products")
      .delete({ count: "exact" })
      .in("shein_product_id", ids)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, deleted: count })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
