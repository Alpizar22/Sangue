import { dropiGet } from "./client"

interface DropiCity {
  id?: number
  cod_dane?: string
  codigo?: string
  nombre?: string
  name?: string
  departamento?: string
  estado?: string
}

interface CitiesResponse {
  status?: boolean
  results?: DropiCity[] | { data?: DropiCity[] }
  data?: DropiCity[]
  ciudades?: DropiCity[]
}

// In-process cache so we only fetch once per Lambda cold start
let citiesCache: DropiCity[] | null = null

async function getCities(): Promise<DropiCity[]> {
  if (citiesCache) return citiesCache
  try {
    const res = await dropiGet<CitiesResponse>("/cities")
    const raw =
      Array.isArray(res.results) ? res.results :
      Array.isArray((res.results as { data?: DropiCity[] })?.data) ? (res.results as { data?: DropiCity[] }).data! :
      Array.isArray(res.data) ? res.data :
      Array.isArray(res.ciudades) ? res.ciudades :
      []
    citiesCache = raw
    return raw
  } catch {
    return []
  }
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
}

export async function getCodDane(ciudad: string, estado?: string): Promise<string | null> {
  const cities = await getCities()
  if (!cities.length) return null

  const normCity = normalize(ciudad)
  const normState = estado ? normalize(estado) : null

  // Exact match first
  for (const c of cities) {
    const name = normalize(c.nombre ?? c.name ?? "")
    const dept = normalize(c.departamento ?? c.estado ?? "")
    if (name === normCity && (!normState || dept === normState)) {
      return c.cod_dane ?? c.codigo ?? String(c.id ?? "")
    }
  }

  // Partial match
  for (const c of cities) {
    const name = normalize(c.nombre ?? c.name ?? "")
    if (name.includes(normCity) || normCity.includes(name)) {
      return c.cod_dane ?? c.codigo ?? String(c.id ?? "")
    }
  }

  return null
}
