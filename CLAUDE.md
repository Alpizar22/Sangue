# Proyecto Theia — Contexto para Claude Code

Lee este archivo completo antes de hacer cualquier cambio.

## Stack actual

- Next.js 16.2.4 (App Router) + React 19 + TypeScript.
- Supabase para catálogo, pedidos, eventos de pago, curaduría editorial y newsletter.
- Vercel para producción.
- MercadoPago para pagos.
- Printful como proveedor y flujo de fulfillment activo.

Producción: https://www.theia.lat
Repositorio: https://github.com/Alpizar22/Sangue

Este proyecto usa una versión de Next.js con APIs y convenciones que pueden diferir de versiones anteriores. Antes de modificar código, consulta la guía relevante en `node_modules/next/dist/docs/` y respeta los avisos de deprecación.

## Proveedores e integraciones

- **Printful es el proveedor activo.** El catálogo, las variantes y el fulfillment vigente se apoyan en esta integración.
- **CJ, Dropi y Shein son código legado.** Sus rutas, campos, scripts o integraciones pueden seguir presentes en el repositorio, pero no representan el flujo comercial vigente y no deben tomarse como fuente de verdad para nuevas implementaciones.
- **MercadoPago está activo en producción.** El checkout y su webhook forman parte del flujo vigente.

## Estructura de secciones

- `/coleccion` → colección activa.
- `/productos` y `/productos/[slug]` → catálogo y ficha de producto.
- `/jerseys` → sección pausada; actualmente muestra únicamente una página estática de “Próximamente”.
- `/admin` → panel de administración con acceso restringido.
- `/ayuda/*` → seguimiento, envíos, devoluciones y preguntas frecuentes.
- `/la-casa` y `/filosofia` → contenido de marca.

## Datos relevantes en Supabase

- `products` contiene los datos comerciales, imágenes, precios, variantes y campos de proveedor.
- Los campos editoriales de producto son `display_name`, `subtitle`, `chapter`, `story` y `editorial_images`.
- `orders` almacena pedidos, artículos, cliente, dirección, estado, referencias de pago y fulfillment.
- `payment_events` registra eventos y errores relacionados con pagos.
- `newsletter_subscribers` almacena suscripciones únicas por correo.

La migración `supabase/migrations/add_editorial_layer.sql` ya fue aplicada en producción. No debe volverse a plantear como trabajo pendiente.

## Precios y envío

- El envío actual es de **$155 MXN fijos**.
- Se suma en checkout como una línea separada.
- El envío no debe incluirse dentro del precio mostrado del producto.
- No reutilizar fórmulas históricas de CJ, Dropi o Shein para productos Printful.

## Funcionalidad vigente — no reimplementar

- Checkout de MercadoPago funcionando en producción.
- Webhook de MercadoPago conectado al flujo de fulfillment de Printful.
- Importación y sincronización del catálogo Printful.
- Galería de producto adaptable a móvil.
- Selector de variantes por color y talla.
- Carrito persistente.
- Panel administrativo para productos, pedidos, precios e importación.
- Páginas de ayuda y navegación de tienda.
- Capa editorial de productos y contenido de marca.
- Newsletter funcional mediante `/api/newsletter` y la tabla `newsletter_subscribers`.
- Marca de agua “By Nasus” fija en la interfaz.

## Capa editorial

La capa editorial está implementada y aplicada. Los campos curados son opcionales y se superponen a los datos originales de Printful mediante `src/lib/presentation.ts`:

- nombre público: `display_name`, con fallback al título del proveedor;
- descriptor: `subtitle`, con fallback a la subcategoría;
- narrativa: `chapter` y `story`;
- imágenes: `editorial_images`, con fallback a las imágenes de Printful.

La sincronización de Printful no debe sobrescribir estos campos. El contenido editorial global del sitio vive en `src/lib/editorial.ts`.

## Resolución segura de variantes Printful

El fix quedó implementado en el commit `6726902d1af6f9fca65b47452d99ca2bb10a5b49`.

- La variante se resuelve por la combinación exacta de color y talla usando `printful_variant_map`.
- La búsqueda tolera diferencias de espacios y mayúsculas/minúsculas.
- Si existe un mapa poblado y la combinación no aparece, la resolución falla de forma explícita y no usa silenciosamente una variante distinta.
- `printful_variant_id` solo funciona como fallback cuando el mapa no existe o está vacío.
- La lógica pura está en `src/lib/printfulVariant.ts` y tiene validaciones reproducibles en `scripts/test-printful-variant.ts`.

No reimplementar ni relajar este comportamiento sin revisar cuidadosamente el impacto sobre fulfillment.

## Convenciones de trabajo

- Diseño mobile-first.
- Paleta crema y tierra, tipografía editorial y estética de lujo discreto/minimalismo cálido.
- Preservar los cambios locales existentes que no pertenezcan a la tarea.
- No leer, mostrar ni modificar valores de `.env.local`.
- Antes de modificar código, revisar el estado de Git y la documentación local de Next.js correspondiente.
- Después de cambios funcionales, verificar con las pruebas y el build pertinentes antes de preparar un commit.
