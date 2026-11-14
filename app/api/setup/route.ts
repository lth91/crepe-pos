import { ensureSchema } from "@/lib/schema";

export async function GET() {
  await ensureSchema();
  return Response.json({ ok: true, message: "Schema ready" });
}
