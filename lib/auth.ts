import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { one, RESTAURANT_COLS, type Restaurant } from "./db";

const COOKIE = "menuqr_session";
const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET || "dev-only-secret-change-me");

export const hashPassword = (p: string) => bcrypt.hash(p, 10);
export const checkPassword = (p: string, hash: string) => bcrypt.compare(p, hash);

export async function startSession(restaurantId: number) {
  const token = await new SignJWT({ rid: restaurantId })
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

export async function getRestaurant(): Promise<Restaurant | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const r = await one<Restaurant>(`SELECT ${RESTAURANT_COLS} FROM restaurants WHERE id = ?`, [Number(payload.rid)]);
    return r ?? null;
  } catch {
    return null;
  }
}

export async function requireRestaurant(): Promise<Restaurant> {
  const r = await getRestaurant();
  if (!r) redirect("/admin/login");
  return r;
}
