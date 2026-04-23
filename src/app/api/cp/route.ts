import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

interface CopomexResponse {
  error: boolean
  response: {
    asentamiento: string[]
    municipio: string
    estado: string
    ciudad: string
  }
}

export async function GET(req: NextRequest) {
  const cp = req.nextUrl.searchParams.get("cp")?.trim()
  if (!cp || !/^\d{5}$/.test(cp)) {
    return NextResponse.json({ error: "CP debe tener 5 dígitos" }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://api.copomex.com/query/info_cp/${cp}?token=pruebas`,
      { next: { revalidate: 86400 } }
    )
    if (!res.ok) {
      return NextResponse.json({ error: "CP no encontrado" }, { status: 404 })
    }
    const data: CopomexResponse = await res.json()
    if (data.error) {
      return NextResponse.json({ error: "CP no encontrado" }, { status: 404 })
    }
    const r = data.response
    return NextResponse.json({
      municipio: r.municipio,
      estado: r.estado,
      ciudad: r.ciudad || r.municipio,
      colonias: r.asentamiento ?? [],
    })
  } catch {
    return NextResponse.json({ error: "Error al consultar CP" }, { status: 500 })
  }
}
