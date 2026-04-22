import MercadoPago from "mercadopago"

let mpClient: MercadoPago | null = null

export function getMercadoPagoClient(): MercadoPago {
  if (!mpClient) {
    mpClient = new MercadoPago({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    })
  }
  return mpClient
}
