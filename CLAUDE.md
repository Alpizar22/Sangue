\# Proyecto Theia — Contexto para Claude Code



\## Stack

Next.js 14 + TypeScript + Supabase + Vercel + MercadoPago + CJDropshipping API

Producción: https://www.theia.lat

Repo: github.com/alpizar22/Sangue



\## Estructura de secciones

\- /coleccion → ropa mujer (Lady Dresses, Blouses \& Shirts)

\- /jerseys → jerseys de fútbol hombre

\- /admin → panel administración (login requerido)

\- /ayuda/\* → seguimiento, envios, devoluciones, preguntas-frecuentes



\## Schema Supabase relevante

\- products: id, title, price, images (jsonb), category, subcategory,

&#x20; seccion, source, cj\_variant\_id, variants (jsonb), 

&#x20; color\_sizes (jsonb), description, created\_at

\- orders: id, status, items (jsonb), customer\_\*, shipping\_\*,

&#x20; mercadopago\_payment\_id, cj\_order\_id, supplier\_order\_id

\- payment\_events: id, payment\_id, order\_id, status, error\_message, raw



\## Precios

\- Fórmula: (costo\_CJ\_USD × 17.5) × 1.30, redondeado al 10 MXN superior

\- Envío: $120 MXN fijo, se suma en checkout como línea separada

\- NO incluir envío en el precio del producto



\## Variables de entorno (.env.local)

NEXT\_PUBLIC\_SUPABASE\_URL, NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY,

SUPABASE\_SERVICE\_ROLE\_KEY, MERCADOPAGO\_ACCESS\_TOKEN,

MERCADOPAGO\_PUBLIC\_KEY, NEXT\_PUBLIC\_MERCADOPAGO\_PUBLIC\_KEY,

NEXT\_PUBLIC\_SITE\_URL=https://www.theia.lat, CJ\_API\_KEY,

CJ\_EMAIL, CJ\_PASSWORD, ADMIN\_SECRET\_KEY



\## Lo que ya está implementado — NO reimplementar

\- Webhook MercadoPago → orden CJ automática

\- Sync CJ multi-categoría con rate limiting

\- Checkout con MercadoPago producción funcionando

\- Galería con carousel mobile + scroll-snap + dots

\- Selector variantes filtrado por color → tallas disponibles

\- Filtros con feedback visual y badge contador

\- Páginas /ayuda/\* con contenido real

\- Footer con links funcionales

\- Panel admin: productos, pedidos, precios, sync, enrich



\## Pendiente

\- Separación total /coleccion vs /jerseys (rutas independientes)

\- Precios sin envío + envío $120 separado en checkout

\- Re-enrich productos para popular color\_sizes

\- Fix selector tallas/colores en mobile



\## Convenciones

\- Paleta: crema (#f5f0e8), oscuro (#1a1a1a), accent lunar

\- Mobile-first siempre

\- Después de cada cambio: next build \&\& git add . \&\& git commit \&\& git push

