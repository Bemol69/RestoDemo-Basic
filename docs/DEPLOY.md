# Publicar en Vercel

Vercel no guarda archivos entre visitas, por eso la web necesita una base de datos externa. Se usa **Turso** (SQLite en la nube, plan gratis).

## 1. Base de datos (Turso)

```bash
turso auth login
turso db create restodemo
turso db show restodemo --url          # -> DATABASE_URL (libsql://...)
turso db tokens create restodemo       # -> DATABASE_AUTH_TOKEN
```

Las tablas y el menú de demostración se crean solos en la primera visita.

## 2. Variables de entorno en Vercel

En el proyecto de Vercel → Settings → Environment Variables:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | la URL `libsql://...` de Turso |
| `DATABASE_AUTH_TOKEN` | el token de Turso |
| `SESSION_SECRET` | texto largo y aleatorio (`openssl rand -hex 32`) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | cuenta del administrador (elige una contraseña fuerte) |
| `MESERO_EMAIL` / `MESERO_PASSWORD` | cuenta del mesero |

Sin las variables de cuentas, en producción **no se crea ningún usuario** (así la web pública nunca queda con contraseñas conocidas).

## 3. Importar el repositorio

Vercel → Add New → Project → importa el repositorio de GitHub. El framework (Next.js) se detecta solo. Después de guardar las variables, redeploy.

## Notas

- El plan Hobby de Vercel es solo para uso **no comercial**. Para cobrar a un restaurante usa el plan Pro u otro hosting.
- Si el menú crece mucho, cambia `lib/media.ts` por almacenamiento de objetos (Vercel Blob o Cloudflare R2).
- Los QR usan el dominio con el que abras la portada: abre `/` desde tu dominio final antes de imprimirlos.
