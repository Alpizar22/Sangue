// Contenido editorial de sitio (no de producto) — se edita a mano en código.
// No hay CMS todavía; esto es la fuente de verdad para el hero de home y
// los bloques de marca. Nada aquí viene de Printful ni se inventa como
// dato de producto.

export interface HeroConfig {
  eyebrow: string
  title: string
  text: string
  cta: string
  ctaHref: string
  /** Si se define, el hero pasa a modo editorial con imagen. Si es null,
   *  modo tipográfico (el actual). Opcional para el futuro. */
  image: string | null
}

export const HERO: HeroConfig = {
  eyebrow: "CHAPTER I",
  title: "LIGHT",
  text: "Esenciales diseñados para permanecer.",
  cta: "EXPLORAR COLECCIÓN",
  ctaHref: "/coleccion",
  image: null,
}

export const INTRO = {
  eyebrow: "THEIA",
  text: "Una casa de diseño mexicana enfocada en básicos atemporales. Menos prendas, mejor pensadas — construidas alrededor de la forma, la materia y la luz.",
}

export const MANIFESTO = {
  eyebrow: "MANIFIESTO",
  lines: [
    "Diseñamos para permanecer, no para la temporada.",
    "Cada pieza se produce bajo demanda — nada se fabrica de más.",
    "El producto habla antes que el logo.",
  ],
}

export const MATERIALS = {
  eyebrow: "MATERIA",
  text: "Trabajamos con talleres de impresión y confección bajo demanda, pieza por pieza, en vez de producir inventario especulativo. Cada prenda se hace después de que la pides, no antes.",
}
