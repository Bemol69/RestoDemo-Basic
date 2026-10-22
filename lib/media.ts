import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

const IMAGE = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif"]);

/**
 * Saves an uploaded photo and returns its public URL.
 * MVP: local disk (public/uploads). For production swap this one function
 * for Cloudflare R2 (free 10 GB, S3 compatible) - see docs/ARCHITECTURE.md.
 */
export async function savePhoto(file: File | null, restaurantId: number) {
  if (!file || file.size === 0) return null;
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!IMAGE.has(ext)) throw new Error(`Formato no permitido: .${ext}`);
  if (file.size > 8 * 1024 * 1024) throw new Error("La foto pesa más de 8 MB.");
  const dir = path.join(process.cwd(), "public", "uploads", String(restaurantId));
  await mkdir(dir, { recursive: true });
  const name = `${randomBytes(8).toString("hex")}.${ext}`;
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${restaurantId}/${name}`;
}
