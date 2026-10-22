"use server";

import { redirect } from "next/navigation";
import { one, run } from "@/lib/db";
import { checkPassword, endSession, requireRestaurant, startSession } from "@/lib/auth";

export async function login(_: string | null, f: FormData): Promise<string | null> {
  const email = String(f.get("email") ?? "").trim().toLowerCase();
  const r = await one<{ id: number; password_hash: string }>(
    "SELECT id, password_hash FROM restaurants WHERE owner_email = ?",
    [email],
  );
  if (!r || !(await checkPassword(String(f.get("password") ?? ""), r.password_hash))) return "Email o contraseña incorrectos.";
  await startSession(r.id);
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

export async function answerCall(id: number) {
  const r = await requireRestaurant();
  await run(
    "UPDATE calls SET status = 'atendido', answered_at = datetime('now') WHERE id = ? AND restaurant_id = ? AND status = 'pendiente'",
    [id, r.id],
  );
}
