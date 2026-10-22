import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { logout } from "../actions";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/admin/login");
  return (
    <div className="waiter">
      <header className="waiter-bar">
        <span className="logo">Menu<span>QR</span> · {s.restaurant.name} <small className="pill">{s.role}</small></span>
        <nav className="bar-nav">
          <Link href="/admin">🔔 Llamados</Link>
          {s.role === "admin" && <Link href="/admin/menu">🍽️ Editar carta</Link>}
          <Link href={`/r/${s.restaurant.slug}`} target="_blank">👁️ Ver carta</Link>
          <form action={logout}><button className="ghost">Salir</button></form>
        </nav>
      </header>
      <main className="waiter-main">{children}</main>
    </div>
  );
}
