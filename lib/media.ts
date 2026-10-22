import { randomBytes } from "node:crypto";
import { run } from "./db";

const MIME: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", avif: "image/avif" };

/**
 * Stores an uploaded photo in the database (base64) and returns its URL.
 * Works on serverless hosts like Vercel, where the disk is read-only. The browser
 * shrinks photos before uploading (see SaveForm), so rows stay small. If the menu
 * grows a lot, swap this one function for object storage (Cloudflare R2 / Vercel Blob).
 */
export async function savePhoto(file: File | null, _restaurantId: number) {
  if (!file || file.size === 0) return null;
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const mime = MIME[ext];
  if (!mime) throw new Error(`Formato no permitido: .${ext}. Usa JPG, PNG o WebP.`);
  if (file.size > 3.5 * 1024 * 1024) throw new Error("La foto pesa demasiado (máximo 3.5 MB).");
  const id = randomBytes(10).toString("hex");
  await run("INSERT INTO media (id, mime, data) VALUES (?, ?, ?)", [id, mime, Buffer.from(await file.arrayBuffer()).toString("base64")]);
  return `/api/media/${id}`;
}
