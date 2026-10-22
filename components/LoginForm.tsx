"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/app/admin/actions";
import Logo from "@/components/Logo";

export default function LoginForm() {
  const [error, action, pending] = useActionState(login, null);
  return (
    <div className="auth-page">
      <form className="auth" action={action}>
        <Logo />
        <h2>Acceso del personal</h2>
        <p className="muted">Meseros: reciban los llamados de las mesas. Administrador: edite la carta.</p>
        <label>Correo<input name="email" type="email" required autoComplete="username" /></label>
        <label>Contraseña<input name="password" type="password" required autoComplete="current-password" /></label>
        {error && <p className="err">{error}</p>}
        <button disabled={pending} style={{ width: "100%", marginTop: 6 }}>{pending ? "Entrando…" : "Entrar"}</button>
        <p className="center" style={{ marginTop: 16, fontSize: ".9rem" }}><Link className="muted" href="/">← Volver al inicio</Link></p>
      </form>
    </div>
  );
}
