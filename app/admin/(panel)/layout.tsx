import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import StaffTabs from "@/components/StaffTabs";
import { getSession } from "@/lib/auth";
import { logout } from "../actions";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/admin/login");
  return (
    <>
      <header className="staff-bar">
        <div className="wrap">
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Logo href="/admin" light />
            <span className="role-pill">{s.role === "admin" ? "Administrador" : "Mesero"}</span>
          </span>
          <nav className="staff-tabs">
            <StaffTabs admin={s.role === "admin"} slug={s.restaurant.slug} />
            <form action={logout}><button className="ghost">Salir</button></form>
          </nav>
        </div>
      </header>
      <main className="staff-main">{children}</main>
    </>
  );
}
