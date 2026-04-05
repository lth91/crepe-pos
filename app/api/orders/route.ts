import { getDb } from "@/lib/db";

export async function POST(req: Request) {
  const { items, total, method } = await req.json();

  if (!items || !total || !method) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  const sql = getDb();
  const result = await sql`
    INSERT INTO orders (items, total, method)
    VALUES (${JSON.stringify(items)}, ${total}, ${method})
    RETURNING id, created_at
  `;

  return Response.json({ ok: true, order: result[0] });
}
