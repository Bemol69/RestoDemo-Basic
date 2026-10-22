"use client";

import { useActionState } from "react";
import { login } from "@/app/admin/actions";

export default function LoginForm() {
  const [error, action, pending] = useActionState(login, null);
  return (
    <form className="auth" action={action}>
      <h2>Entrar</h2>
      <p className="muted">Cuenta de mesero (llamados) o de administrador (editar la carta).</p>
      <label>Email<input name="email" type="email" required /></label>
      <label>Contraseña<input name="password" type="password" required /></label>
      {error && <p className="err">{error}</p>}
      <button disabled={pending} style={{ width: "100%" }}>{pending ? "…" : "Entrar"}</button>
    </form>
  );
}
