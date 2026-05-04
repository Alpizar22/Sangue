# Theia — Checklist de Testing Punta a Punta

## Credenciales MercadoPago
- Verificar si el `MERCADOPAGO_ACCESS_TOKEN` es de producción (`APP_USR-...`) o sandbox (`TEST-...`)
- Si es producción, crear producto con precio mínimo $1 MXN para prueba real
- Sandbox: usar tarjetas de prueba oficiales de MercadoPago

## Variables de entorno críticas (verificar en Vercel → Settings → Env)
- [ ] `MERCADOPAGO_ACCESS_TOKEN` presente
- [ ] `CJ_API_KEY` o `CJ_EMAIL` + `CJ_PASSWORD` presente
- [ ] `NEXT_PUBLIC_SUPABASE_URL` presente
- [ ] `SUPABASE_SERVICE_ROLE_KEY` presente
- [ ] `NEXT_PUBLIC_SITE_URL=https://www.theia.lat`

## Flujo completo

### Navegación y catálogo
- [ ] Home (`/`) carga correctamente con imagen hero
- [ ] `/coleccion` muestra productos con imágenes (no placeholders)
- [ ] Filtros por categoría/talla funcionan y muestran badge contador
- [ ] Buscador (ícono lupa) devuelve resultados con imagen thumbnail
- [ ] `/jerseys` muestra "Próximamente" y no productos

### Página de producto
- [ ] `/productos/[slug]` carga con galería y variantes
- [ ] Selector de color cambia imagen principal (mobile y desktop)
- [ ] Selector de talla filtra opciones por color seleccionado
- [ ] "Agregar al carrito" funciona solo con talla seleccionada
- [ ] Sin talla seleccionada muestra mensaje de error/aviso

### Carrito y checkout
- [ ] Carrito muestra productos + subtotal + envío $155 + total correcto
- [ ] Checkout — campos de dirección sin perder foco al tipear en móvil
- [ ] CP `45645` (Chapala) autocompletado con colonia/ciudad/estado
- [ ] Formulario valida campos vacíos antes de pagar

### Pago y post-pago
- [ ] Botón MercadoPago abre correctamente (no error de credenciales)
- [ ] Pago procesa y redirige a `/pedidos/[id]`
- [ ] Página de pedido muestra estado correcto
- [ ] Webhook recibe notificación de MP y actualiza orden en Supabase

### Admin
- [ ] `/admin/login` acepta clave y redirige al panel
- [ ] Admin muestra contador de productos activos
- [ ] Admin muestra pedidos con estado actualizado
- [ ] Sync CJ responde sin error 401/403
- [ ] Enrich actualiza `color_sizes` en al menos 1 producto

## Diagnóstico rápido (ejecutar desde admin o consola)
```
# Contar productos activos en Supabase
SELECT COUNT(*) FROM products WHERE status = 'active';

# Ver últimas órdenes
SELECT id, status, created_at FROM orders ORDER BY created_at DESC LIMIT 5;

# Verificar webhook URL registrado en MercadoPago
# → Panel MP → Tu negocio → Webhooks → Notificaciones
# URL debe ser: https://www.theia.lat/api/webhooks/mercadopago
```

## Producto de prueba para pago real
Crear en admin `/admin/productos/nuevo` con:
- Título: "PRUEBA - No comprar"
- Precio: $1 MXN
- Status: active
- Eliminar después de la prueba
