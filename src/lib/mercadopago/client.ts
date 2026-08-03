import MercadoPago from "mercadopago"

let mpClient: MercadoPago | null = null

// Huella no sensible del token: prefijo y el user id final (último segmento),
// suficiente para distinguir producción de prueba sin exponer el secreto.
// Un access token tiene la forma APP_USR-<clientId>-<fecha>-<hash>-<userId>;
// solo el hash intermedio es secreto y nunca se registra.
export function describeAccessToken(token: string | undefined): string {
  if (!token) return "AUSENTE"
  const segments = token.split("-")
  const userId = segments.length >= 5 ? segments[segments.length - 1] : "?"
  const kind = token.startsWith("TEST-") ? "test-legacy" : token.startsWith("APP_USR-") ? "app_usr" : "desconocido"
  return `${token.slice(0, 10)}… (tipo=${kind}, userId=${userId}, largo=${token.length})`
}

export function getMercadoPagoClient(): MercadoPago {
  if (!mpClient) {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!accessToken) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN no está configurado")
    }
    // Se registra una sola vez, al crear el cliente, para poder confirmar qué
    // credencial quedó activa en el entorno sin revisar variables a mano.
    console.info(`[mercadopago] Cliente inicializado con token ${describeAccessToken(accessToken)}`)
    mpClient = new MercadoPago({ accessToken })
  }
  return mpClient
}
