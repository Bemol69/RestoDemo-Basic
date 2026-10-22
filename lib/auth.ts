import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { one, RESTAURANT_COLS, type Restaurant } from "./db";

const COOKIE = "menuqr_session";
const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET || "dev-only-secret-change-me");

export type Role = "admin" | "mesero";

export const hashPassword = (p: string) => bcrypt.hash(p, 10);
export const checkPassword = (p: string, hash: string) => bcrypt.compare(p, hash);

export async function startSession(restaurantId: number, role: Role) {
  const token = await new SignJWT({ rid: restaurantId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function getSession(): Promise<{ restaurant: Restaurant; role: Role } | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.role !== "admin" && payload.role !== "mesero") return null;
    const restaurant = await one<Restaurant>(`SELECT ${RESTAURANT_COLS} FROM restaurants WHERE id = ?`, [Number(payload.rid)]);
    return restaurant ? { restaurant, role: payload.role } : null;
  } catch {
    return null;
  }
}

/** Any signed-in staff member (admin or mesero). */
export async function getRestaurant(): Promise<Restaurant | null> {
  return (await getSession())?.restaurant ?? null;
}

export async function requireRestaurant(): Promise<Restaurant> {
  const s = await getSession();
  if (!s) redirect("/admin/login");
  return s.restaurant;
}

/** Only the admin account may edit the menu; a mesero is sent back to the calls screen. */
export async function requireAdmin(): Promise<Restaurant> {
  const s = await getSession();
  if (!s) redirect("/admin/login");
  if (s.role !== "admin") redirect("/admin");
  return s.restaurant;
}
