# Negocio: que el restaurante quiera pagar

## Por qué pagarían
Un restaurante paga si el producto **le da más ventas o le ahorra trabajo**, no por "tener un QR". El valor a vender:

1. **Más ticket promedio**: fotos y video venden más platos y bebidas (el cliente ve lo que pide).
2. **Menos trabajo del mesero**: el pedido llega solo al panel; menos errores.
3. **Carta siempre al día**: cambiar un precio o marcar "agotado" en 10 segundos vs. reimprimir o reenviar un PDF.
4. **Cero fricción**: sin app que instalar.

Pitch de una línea: *"Tu carta con fotos y video, y los pedidos llegan solos a tu panel. Pruébalo gratis 14 días."*

## Precio
Referencia del video: hasta ~50 USD/mes. Propuesta para arrancar en LatAm:
- **Prueba gratis 14 días** (sin tarjeta), luego **~25–30 USD/mes** plan único.
- Bono de lanzamiento: configuración de la carta inicial gratis (tú subes las fotos) a los primeros 10 clientes.
- Cobro: transferencia / Mercado Pago / Wompi / Stripe según el país. Al inicio se puede cobrar a mano; automatizar después.

## Costos tuyos (≈ 0)
Hosting, BD y media en planes gratis (ver ARCHITECTURE.md). Tu costo real es tiempo de venta y soporte por WhatsApp.

## Cómo conseguir los primeros 10 clientes
1. Elige **una ciudad y un tipo de local** (cafeterías o restaurantes medianos).
2. Haz **la carta demo con SU menú antes de la visita** (tomas el PDF de su Instagram, como en el video) y llévala en el celular.
3. Visita presencial / WhatsApp con captura: "Te dejé tu carta lista, míra cómo queda".
4. Pide referidos: cada restaurante cuenta a otros dos.

## Roadmap (prioridad por dinero)
**Fase 1 – MVP (hecho)**: carta, pedidos, panel, QR.
**Fase 2 – Listo para cobrar**: despliegue + R2 para fotos, dominio, suscripción/trial, recuperación de contraseña, onboarding con importación asistida.
**Fase 3 – Retención**: métricas (platos más vistos/pedidos), ticket promedio, horario y "cerrado", multi-idioma ES/EN, importar carta desde PDF/foto con IA.
**Fase 4 – Más ingresos**: llamar al mesero / pedir la cuenta, pago en mesa, propinas, domicilio y recoger, cupones, multi-sucursal, impresión de comandas, WhatsApp automático.

## Riesgos
- Competidores gratis (Google Sites, QR de PDF): gana quien **sube las fotos por el cliente** y da soporte.
- Churn: sin uso diario, cancelan. Los pedidos en panel y las métricas crean hábito.
- Videos pesados: limitarlos y comprimirlos.
