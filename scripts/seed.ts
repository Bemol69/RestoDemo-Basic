import { init } from "../lib/db";

// Optional: the app also seeds itself on first request. Run `npm run seed` to do it eagerly.
init().then(() => console.log("Listo: restaurante demo y cuentas creadas (si faltaban)."));
