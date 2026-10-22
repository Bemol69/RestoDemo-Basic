import { one } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await one<{ mime: string; data: string }>("SELECT mime, data FROM media WHERE id = ?", [id]);
  if (!m) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(m.data, "base64"), {
    headers: { "content-type": m.mime, "cache-control": "public, max-age=31536000, immutable" },
  });
}
