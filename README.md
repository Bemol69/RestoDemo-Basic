# MenuQR

Dos ventanas, nada más:

1. **Cliente**: escanea el QR → ve la carta (con fotos reales) → toca **🔔 Llamar al mesero**, escribe su número de mesa y llama. Ve en pantalla cuándo el mesero ya lo atiende.
2. **Mesero** (`/admin`): inicia sesión y recibe cada llamado con el número de mesa, sonido y notificación del navegador. Toca **Voy para allá** y al cliente le cambia el aviso.

La página `/` muestra el QR de la carta (y los QR por mesa para imprimir, que ya traen `?mesa=N`).

## Arrancar

```bash
npm install
npm run seed     # restaurante demo con 8 platos
npm run dev      # http://localhost:3000
```

- Carta: http://localhost:3000/r/demo?mesa=4
- Panel: http://localhost:3000/admin → dos cuentas, mesero (llamados) y admin (editar carta). Credenciales de demo en `scripts/seed.ts`.

Para escanear el QR con un celular real, el celular y el PC deben estar en el mismo Wi-Fi y el servidor debe escucharlo: `npx next dev -H 0.0.0.0`. La portada usa la IP del PC automáticamente.

## Notas

- Fotos de Wikimedia Commons con licencias libres; créditos en `public/menu/CREDITS.md`.
- Los avisos funcionan con la pestaña del mesero abierta (sonido + notificación). Para avisar con la app cerrada hace falta Web Push (siguiente paso).
- Un solo llamado abierto por mesa: si el cliente toca dos veces, no se duplica.
- Stack: Next.js + SQLite (`local.db`), en producción Turso gratis. Ver `docs/ARCHITECTURE.md`.
