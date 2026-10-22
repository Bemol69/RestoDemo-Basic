import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { one, query, RESTAURANT_COLS, type Category, type Item, type Restaurant } from "@/lib/db";
import MenuClient from "@/components/MenuClient";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ mesa?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const r = await one<Restaurant>(`SELECT ${RESTAURANT_COLS} FROM restaurants WHERE slug = ?`, [slug]);
  return { title: r ? `${r.name} · Carta` : "Carta" };
}

export default async function PublicMenu({ params, searchParams }: Props) {
  const { slug } = await params;
  const { mesa } = await searchParams;
  const r = await one<Restaurant>(`SELECT ${RESTAURANT_COLS} FROM restaurants WHERE slug = ?`, [slug]);
  if (!r) notFound();
  const categories = await query<Category>("SELECT * FROM categories WHERE restaurant_id = ? ORDER BY position, id", [r.id]);
  const items = await query<Item>("SELECT * FROM items WHERE restaurant_id = ? ORDER BY position, id", [r.id]);
  return <MenuClient restaurant={r} categories={categories} items={items} table={mesa?.slice(0, 20) ?? ""} />;
}
