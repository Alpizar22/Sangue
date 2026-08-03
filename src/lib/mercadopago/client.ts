import MercadoPago from "mercadopago"

let mpClient: MercadoPago | null = null

// Un access token pegado con un salto de línea al final tumbó el checkout en
// producción: el SDK arma "Authorization: Bearer <token>\n" y MercadoPago
// rechaza la cabecera. El valor era correcto; solo sobraba un carácter
// invisible. Por eso toda credencial se normaliza y se audita antes de usarse.
//
// Criterio de estrictez: se rechaza lo que rompe de verdad (vacío, espacios
// internos, caracteres de control, prefijo equivocado) y solo se advierte ante
// desviaciones de forma. Validar la forma exacta sería contraproducente: si
// MercadoPago cambia el formato, un regex demasiado estricto tumbaría los pagos
// por su cuenta, que es justo el fallo que intentamos evitar.

const ACCESS_TOKEN_SHAPE = /^(APP_USR|TEST)-[A-Za-z0-9]+-\d+-[0-9a-fA-F]+-\d+$/
const PUBLIC_KEY_SHAPE = /^(APP_USR|TEST)-[0-9a-fA-F-]{30,}$/

// Sin regex a propósito: escribir el rango de caracteres de control como
// literal es propenso a colarse mal en el propio archivo fuente.
function hasControlCharacters(value: string): boolean {
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index)
    if (code < 0x20 || code === 0x7f) return true
  }
  return false
}

export type CredentialKind = "access_token" | "public_key"

export interface CredentialAudit {
  name: string
  /** Valor ya recortado, listo para usar. */
  value: string
  /** Problema que impide usarla. Si existe, no debe usarse. */
  error: string | null
  /** Desviación de forma que no impide usarla, pero conviene revisar. */
  warning: string | null
  /** El valor original traía espacios o saltos de línea alrededor. */
  hadSurroundingWhitespace: boolean
}

export function auditMercadoPagoCredential(
  name: string,
  raw: string | undefined,
  kind: CredentialKind
): CredentialAudit {
  const original = raw ?? ""
  const value = original.trim()
  const hadSurroundingWhitespace = original.length > 0 && original !== value

  const base: CredentialAudit = { name, value, error: null, warning: null, hadSurroundingWhitespace }

  if (!raw) {
    return { ...base, error: `${name} no está configurado.` }
  }
  if (!value) {
    return { ...base, error: `${name} está definido pero vacío (solo espacios o saltos de línea).` }
  }
  if (/\s/.test(value)) {
    return {
      ...base,
      error: `${name} contiene espacios o saltos de línea internos; la credencial está mal copiada.`,
    }
  }
  if (hasControlCharacters(value)) {
    return {
      ...base,
      error: `${name} contiene caracteres de control que invalidan la cabecera Authorization.`,
    }
  }
  if (!value.startsWith("APP_USR-") && !value.startsWith("TEST-")) {
    return {
      ...base,
      error: `${name} no empieza con APP_USR- ni TEST-; parece un valor equivocado (largo=${value.length}).`,
    }
  }

  const shape = kind === "access_token" ? ACCESS_TOKEN_SHAPE : PUBLIC_KEY_SHAPE
  if (!shape.test(value)) {
    return {
      ...base,
      warning: `${name} no coincide con el formato habitual de MercadoPago (largo=${value.length}). Se usará igual; verifica que se haya copiado completo.`,
    }
  }

  return base
}

// Huella no sensible: prefijo y user id final. El hash intermedio, que es la
// parte secreta, nunca se registra.
export function describeAccessToken(token: string | undefined): string {
  if (!token) return "AUSENTE"
  const segments = token.split("-")
  const userId = segments.length >= 5 ? segments[segments.length - 1] : "?"
  const kind = token.startsWith("TEST-") ? "test-legacy" : token.startsWith("APP_USR-") ? "app_usr" : "desconocido"
  return `${token.slice(0, 10)}… (tipo=${kind}, userId=${userId}, largo=${token.length})`
}

function reportAudit(audit: CredentialAudit) {
  if (audit.hadSurroundingWhitespace) {
    console.warn(
      `[mercadopago] ${audit.name} traía espacios o saltos de línea alrededor; se recortaron. ` +
        `Conviene corregir el valor en el entorno para evitar fallos difíciles de diagnosticar.`
    )
  }
  if (audit.warning) console.warn(`[mercadopago] ${audit.warning}`)
}

// Las claves públicas todavía no se consumen (el checkout usa el redirect de
// Checkout Pro, no Bricks), pero se auditan al arrancar para que un pegado
// defectuoso salga en los logs antes de que alguien dependa de ellas.
function auditPublicKeys() {
  for (const name of ["MERCADOPAGO_PUBLIC_KEY", "NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY"] as const) {
    const raw = process.env[name]
    if (raw === undefined) continue
    const audit = auditMercadoPagoCredential(name, raw, "public_key")
    if (audit.error) console.error(`[mercadopago] ${audit.error}`)
    reportAudit(audit)
  }
}

/** Clave pública ya recortada y validada. Lanza si está mal configurada. */
export function getMercadoPagoPublicKey(): string {
  const audit = auditMercadoPagoCredential(
    "NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY",
    process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY,
    "public_key"
  )
  if (audit.error) throw new Error(audit.error)
  reportAudit(audit)
  return audit.value
}

export function getMercadoPagoClient(): MercadoPago {
  if (!mpClient) {
    const audit = auditMercadoPagoCredential(
      "MERCADOPAGO_ACCESS_TOKEN",
      process.env.MERCADOPAGO_ACCESS_TOKEN,
      "access_token"
    )
    if (audit.error) throw new Error(audit.error)
    reportAudit(audit)
    console.info(`[mercadopago] Cliente inicializado con token ${describeAccessToken(audit.value)}`)
    auditPublicKeys()
    mpClient = new MercadoPago({ accessToken: audit.value })
  }
  return mpClient
}
