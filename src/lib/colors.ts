export const COLOR_MAP: Record<string, string> = {
  // Español básico
  negro: "#111111", blanco: "#f5f5f5", rojo: "#c0392b", azul: "#2980b9",
  verde: "#27ae60", amarillo: "#f1c40f", naranja: "#e67e22", rosa: "#e91e8c",
  morado: "#8e44ad", violeta: "#9b59b6", gris: "#95a5a6",
  beige: "#e8d5b0", crema: "#f4f1ec", café: "#795548",
  marrón: "#795548", marino: "#1a237e", dorado: "#9a7b4f", plateado: "#c0c0c0",
  // English basic
  black: "#111111", white: "#f5f5f5", red: "#c0392b", blue: "#2980b9",
  green: "#27ae60", yellow: "#f1c40f", orange: "#e67e22", pink: "#e91e8c",
  purple: "#8e44ad", violet: "#9b59b6", gray: "#95a5a6", grey: "#95a5a6",
  brown: "#795548", navy: "#1a237e", gold: "#9a7b4f", silver: "#c0c0c0",
  cream: "#f4f1ec",
  // Colores usados por los productos garment-dyed de Printful.
  "washed black": "#323438", "vintage white": "#f9f6f2",
  "washed navy": "#525f75", "washed pine": "#5b7b6f",
  "light washed denim": "#dde9f3", "blue jean": "#6b7c8f",
  "military green": "#59633d", "heather stone": "#b7afa1",
  "buttermilk": "#fdf7da", "carbon grey": "#5d6365",
  // Reds
  "wine red": "#722f37", "wine": "#722f37",
  "purplish red": "#9b1b30", "rose red": "#c0394b",
  "dark red": "#8b0000", "brick red": "#cb4154",
  "burgundy": "#800020", "bordeaux": "#800020",
  "coral": "#ff6b6b", "coral red": "#ff4040",
  "watermelon red": "#fc4c4c",
  // Greens
  "light green": "#90ee90",
  "dark green": "#006400", "army green": "#4b5320",
  "moss": "#8a9a5b",
  "olive green": "#6b7c1e", "olive": "#808000",
  "forest green": "#228b22", "hunter green": "#355e3b",
  "mint green": "#98ff98", "mint": "#98ff98",
  "sage green": "#87ae73", "sage": "#87ae73",
  "teal": "#008080", "cyan": "#00bcd4",
  "turquoise": "#40e0d0", "aqua": "#00bcd4",
  // Blues
  "sky blue": "#87ceeb", "light blue": "#add8e6",
  "ice blue": "#d6f1f5",
  "baby blue": "#89cff0", "powder blue": "#b0c4de",
  "royal blue": "#4169e1", "cobalt blue": "#0047ab",
  "navy blue": "#001f5b", "dark blue": "#00008b",
  "denim blue": "#1560bd", "steel blue": "#4682b4",
  // Neutrals/Browns
  "camel": "#c19a6b", "tan": "#d2b48c",
  "khaki": "#c3b091", "sand": "#c2b280",
  "apricot": "#fbceb1", "peach": "#ffcba4",
  // Pinks
  "dusty pink": "#dcae96", "dusty rose": "#c08080",
  "blush pink": "#ffb6c1", "blush": "#ffb6c1",
  "rose": "#ff007f", "hot pink": "#ff69b4",
  "baby pink": "#f4c2c2", "light pink": "#ffb6c1",
  "fuchsia": "#ff00ff", "magenta": "#e040fb",
  "lavender": "#e6e6fa", "lilac": "#c8a2c8",
  // Whites/Champagne
  "champagne": "#f7e7ce", "ivory": "#fffff0",
  "off white": "#faf9f6", "off-white": "#faf9f6",
  "pearl": "#f0ead6", "nude": "#e8c9a0",
  "linen": "#faf0e6",
  // Yellows/Mustards
  "mustard": "#ffdb58", "mustard yellow": "#e1ad01",
  // Browns/Coffees
  "coffee": "#6f4e37", "mocha": "#967117",
  "chocolate": "#7b3f00", "walnut": "#773f1a",
  "caramel": "#c68642",
  // Grays
  "dark grey": "#a9a9a9", "dark gray": "#a9a9a9",
  "light grey": "#d3d3d3", "light gray": "#d3d3d3",
  "charcoal": "#36454f", "charcoal grey": "#36454f",
  "heather grey": "#b2b2b2", "heather gray": "#b2b2b2",
  "smoke grey": "#848884", "slate grey": "#708090",
  "white grey": "#e8e8e8",
}

export function colorToCss(name: string): string | null {
  const normalized = name.toLowerCase().trim().replace(/[-_]/g, " ").replace(/\s+/g, " ")
  const exact = COLOR_MAP[normalized]
  if (exact) return exact

  // Printful suele anteponer acabados como "washed" o "heather". No debemos
  // ocultar una variante real solo porque el proveedor añadió ese prefijo.
  const semanticColor = Object.keys(COLOR_MAP)
    .filter((candidate) => candidate.split(" ").length === 1)
    .find((candidate) => normalized.includes(candidate))

  return semanticColor ? COLOR_MAP[semanticColor] : null
}

export function isLightColor(hex: string): boolean {
  const h = hex.replace("#", "")
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 180
}
