# Restaurant Demo

Web de un restaurante con carta digital y llamado al mesero por QR.

- **Cliente**: escanea el QR de su mesa → ve la carta con fotos → toca **Llamar al mesero** e indica su mesa.
- **Mesero** (`/admin`): recibe cada llamado con el número de mesa, sonido y notificación, y toca **Voy para allá**.
- **Administrador** (`/admin`): edita la carta (platos, precios, fotos, categorías) con un botón **Guardar** visible.

## Probar en tu PC

```bash
npm install
npm run dev      # http://localhost:3000
```

Sin configuración usa un archivo SQLite local y crea cuentas de demostración (ver `lib/seed.ts`).

| Pantalla | Ruta |
|---|---|
| Inicio y QR | `/` |
| Carta del cliente | `/r/demo?mesa=4` |
| Personal (mesero y admin) | `/admin` |

## Publicar en Vercel

Ver [docs/DEPLOY.md](docs/DEPLOY.md). Resumen: base de datos gratis en Turso + 4 variables de entorno en Vercel.

## Notas

- Fotos del menú: Wikimedia Commons con licencias libres, créditos en `public/menu/CREDITS.md`.
- Las fotos que sube el admin se guardan en la base de datos (se reducen en el navegador antes de subir).
- El panel del mesero se actualiza solo. Con **Web Push** (Android/Chrome) el celular recibe un aviso aunque la app esté cerrada; ver `docs/DEPLOY.md`.
- Un solo llamado abierto por mesa: si el cliente toca dos veces, no se duplica.
