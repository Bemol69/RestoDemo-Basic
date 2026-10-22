# Arquitectura y cómo desplegar gratis

## Decisiones

- **Next.js (App Router)**: un solo proyecto con la carta pública, el panel y la API.
- **libSQL**: SQLite en local (`file:local.db`), y en producción [Turso](https://turso.tech) (plan gratis, uso comercial permitido). Mismo código, solo cambia `DATABASE_URL`.
- **Pedidos en vivo por polling (4 s)**: cero costo y cero infraestructura. Más adelante: SSE o Supabase Realtime.
- **Multi-tenant simple**: cada restaurante = una cuenta; todas las tablas llevan `restaurant_id`.
- **Sin dependencias pesadas**: CSS propio, sin UI kit.

## Hosting (ojo con los términos)

El plan Hobby de **Vercel es solo no comercial**: no lo uses para cobrar a clientes. Opciones gratis que sí permiten uso comercial:

1. **Cloudflare Workers/Pages** con `@opennextjs/cloudflare` (recomendado: tráfico generoso, sin cobro por ancho de banda).
2. Un VPS gratuito (Oracle Always Free) con `next start` + Caddy.

## Pendiente antes de producción

- [ ] **Media**: `lib/media.ts` guarda en disco (solo dev). Cambiar `saveUpload` por **Cloudflare R2** (10 GB gratis). Es la única función a reemplazar. Comprimir imágenes al subir; limitar video a ~15 s.
- [ ] `SESSION_SECRET` largo y aleatorio; `PUBLIC_URL` con el dominio real (para los QR).
- [ ] Rate limit del endpoint de pedidos hoy es en memoria; en serverless mover a KV/Turso.
- [ ] Recuperación de contraseña (email con Resend, plan gratis).
- [ ] Backups: Turso permite point-in-time; exportar a diario.
