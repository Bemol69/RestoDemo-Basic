import { requireRestaurant } from "@/lib/auth";
import { logout } from "../actions";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const r = await requireRestaurant();
  return (
    <div className="waiter">
      <header className="waiter-bar">
        <span className="logo">Menu<span>QR</span> · {r.name}</span>
        <form action={logout}><button className="ghost">Salir</button></form>
      </header>
      <main className="waiter-main">{children}</main>
    </div>
  );
}
