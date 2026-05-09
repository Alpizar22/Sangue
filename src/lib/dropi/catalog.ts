import { dropiGet } from "./client"

// Dropi API response shapes — defensive: field names vary between prod/staging
interface DropiVariationRaw {
  id: number
  nombre?: string
  name?: string
  sku?: string
}

interface DropiImageRaw {
  imagen?: string
  image?: string
  url?: string
}

interface DropiProductRaw {
  id: number
  nombre?: string
  name?: string
  descripcion?: string
  description?: string
  imagenes?: Array<DropiImageRaw | string>
  images?: Array<DropiImageRaw | string>
  foto?: string
  precio?: number
  price?: number
  precio_sugerido?: number
  suggested_price?: number
  precio_dropshipper?: number
  variaciones?: DropiVariationRaw[]
  variations?: DropiVariationRaw[]
  categoria?: string
  category?: string
}

export interface DropiProduct {
  id: number
  title: string
  description: string
  images: string[]
  price: number
  variations: { id: number; name: string; sku?: string }[]
  category: string
}

function extractImages(raw: DropiProductRaw): string[] {
  const arr = raw.imagenes ?? raw.images ?? []
  const imgs = arr
    .map((img) => {
      if (typeof img === "string") return img
      return img.imagen ?? img.image ?? img.url ?? ""
    })
    .filter(Boolean)
  if (imgs.length === 0 && raw.foto) imgs.push(raw.foto)
  return imgs
}

function extractPrice(raw: DropiProductRaw): number {
  return (
    raw.precio_sugerido ??
    raw.suggested_price ??
    raw.precio_dropshipper ??
    raw.precio ??
    raw.price ??
    0
  )
}

export function mapDropiProduct(raw: DropiProductRaw): DropiProduct {
  return {
    id: raw.id,
    title: raw.nombre ?? raw.name ?? `Producto ${raw.id}`,
    description: raw.descripcion ?? raw.description ?? "",
    images: extractImages(raw),
    price: extractPrice(raw),
    variations: (raw.variaciones ?? raw.variations ?? []).map((v) => ({
      id: v.id,
      name: v.nombre ?? v.name ?? String(v.id),
      sku: v.sku,
    })),
    category: raw.categoria ?? raw.category ?? "General",
  }
}

interface DropiApiResponse {
  status?: boolean
  success?: boolean
  results?: DropiProductRaw | { data?: DropiProductRaw }
  data?: DropiProductRaw
  producto?: DropiProductRaw
}

export async function fetchDropiProduct(id: number): Promise<DropiProduct> {
  const res = await dropiGet<DropiApiResponse>(`/products/${id}`)
  // Normalize nested response shapes
  const raw =
    (res.results && "id" in res.results ? res.results : null) ??
    (res.results && "data" in res.results ? (res.results as { data?: DropiProductRaw }).data : null) ??
    res.data ??
    res.producto ??
    (res as unknown as DropiProductRaw)

  if (!raw || !raw.id) {
    throw new Error(`Dropi product ${id} not found or unexpected response shape`)
  }
  return mapDropiProduct(raw)
}
