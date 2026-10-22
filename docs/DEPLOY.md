# Publicar en Vercel

Vercel no guarda archivos entre visitas, por eso la web necesita una base de datos externa: **Turso** (SQLite en la nube, plan gratis). Sin ella la web muestra un error 500.

## 1. Conectar la base de datos (lo más fácil)

En el proyecto de Vercel → **Storage** → **Create Database** → elige **Turso** → crea la base y conéctala al proyecto.
Vercel agrega solo las variables `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`, y la app las reconoce.

Alternativa por consola:

```bash
turso auth login
turso db create restodemo
turso db show restodemo --url          # -> DATABASE_URL
turso db tokens create restodemo       # -> DATABASE_AUTH_TOKEN
```

## 2. Variables que faltan

Settings → Environment Variables:

| Variable | Valor |
|---|---|
| `SESSION_SECRET` | texto largo y aleatorio (`openssl rand -hex 32`) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | cuenta del administrador (contraseña fuerte) |
| `MESERO_EMAIL` / `MESERO_PASSWORD` | cuenta del mesero |

Sin las variables de cuentas, en producción **no se crea ningún usuario** (así la web pública nunca queda con contraseñas conocidas). Las tablas y el menú de demostración se crean solos en la primera visita.

## 3. Redeploy

Deployments → el último → ⋯ → **Redeploy** (las variables nuevas solo se aplican en un deploy nuevo).

## Notas

- Las cuentas se crean la primera vez que alguien abre la web. Si cambias el correo o la contraseña en las variables **después**, no se actualizan solas (borra la fila en Turso o crea otro correo).
- El plan Hobby de Vercel es solo para uso **no comercial**. Para cobrar a un restaurante usa el plan Pro u otro hosting.
- Si el menú crece mucho, cambia `lib/media.ts` por almacenamiento de objetos (Vercel Blob o Cloudflare R2).
- Los QR usan el dominio con el que abras la portada: abre `/` desde tu dominio final antes de imprimirlos.
