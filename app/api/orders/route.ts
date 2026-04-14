import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { validateOrderTotal } from "@/lib/menu";
import type { PayMethod } from "@/lib/types";

const VALID_METHODS: PayMethod[] = ["cash", "transfer", "card"];

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
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { items, total, method } = body as {
    items?: unknown[];
    total?: number;
    method?: string;
  };

  if (!Array.isArray(items) || items.length === 0) {
    return Response.json({ error: "Items required" }, { status: 400 });
  }

  if (typeof total !== "number" || total <= 0) {
    return Response.json({ error: "Invalid total" }, { status: 400 });
  }

  if (!method || !VALID_METHODS.includes(method as PayMethod)) {
    return Response.json({ error: "Invalid payment method" }, { status: 400 });
  }

  // Server-side price validation
  const validation = validateOrderTotal(
    items as { name: string; price: number; qty: number; extras?: { name: string; price: number }[] }[]
  );

  if (!validation.valid) {
    return Response.json({ error: "Invalid items or prices" }, { status: 400 });
  }

  if (validation.calculated !== total) {
    return Response.json(
      { error: "Total mismatch", expected: validation.calculated },
      { status: 400 }
    );
  }

  const sql = getDb();
  const result = await sql`
    INSERT INTO orders (items, total, method)
    VALUES (${JSON.stringify(items)}, ${total}, ${method})
    RETURNING id, created_at
  `;

  return Response.json({ ok: true, order: result[0] });
}

export async function DELETE(req: Request) {
  // Auth check
  const cookieStore = await cookies();
  const session = cookieStore.get("pos_session");
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return Response.json({ error: "Missing order id" }, { status: 400 });
  }

  const sql = getDb();
  await sql`DELETE FROM orders WHERE id = ${Number(id)}`;

  return Response.json({ ok: true });
}
