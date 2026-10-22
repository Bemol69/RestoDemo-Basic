"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function StaffTabs({ admin, slug }: { admin: boolean; slug: string }) {
  const path = usePathname();
  const tab = (href: string, label: string) => (
    <Link href={href} className={path === href ? "on" : ""}>{label}</Link>
  );
  return (
    <>
      {tab("/admin", "🔔 Llamados")}
      {admin && tab("/admin/menu", "🍽️ Mi carta")}
      <Link href={`/r/${slug}`} target="_blank">Ver carta ↗</Link>
    </>
  );
}
