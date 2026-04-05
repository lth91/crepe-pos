import { getDb } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = 20;
  const offset = (page - 1) * limit;

  const sql = getDb();

  const rows = await sql`
    SELECT id, items, total, method, created_at
    FROM orders
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const countResult = await sql`SELECT COUNT(*)::int AS total FROM orders`;

  return Response.json({
    orders: rows,
    total: countResult[0].total,
    page,
    totalPages: Math.ceil(countResult[0].total / limit),
  });
}

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
