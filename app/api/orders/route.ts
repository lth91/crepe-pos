import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { validateOrderTotal, NOTE_MAX_LENGTH } from "@/lib/menu";
import type { PayMethod } from "@/lib/types";

const VALID_METHODS: PayMethod[] = ["cash", "transfer", "card"];

// Serialises order-number assignment so two orders never get the same number.
const ORDER_NO_LOCK_KEY = 727001;

async function isLoggedIn() {
  const cookieStore = await cookies();
  return Boolean(cookieStore.get("pos_session"));
}

type RawItem = {
  name?: unknown;
  price?: unknown;
  qty?: unknown;
  extras?: unknown;
  cartKey?: unknown;
  note?: unknown;
};

/** Keep only the fields we store, so clients cannot write arbitrary JSON. */
function normalizeItem(raw: RawItem) {
  const extras = Array.isArray(raw.extras)
    ? (raw.extras as { name?: unknown; price?: unknown }[]).map((e) => ({
        name: String(e?.name),
        price: Number(e?.price),
      }))
    : [];
  const note = typeof raw.note === "string" ? raw.note.trim().slice(0, NOTE_MAX_LENGTH) : "";

  return {
    name: String(raw.name),
    price: Number(raw.price),
    qty: Number(raw.qty),
    ...(extras.length > 0 ? { extras } : {}),
    cartKey: typeof raw.cartKey === "string" ? raw.cartKey.slice(0, 200) : String(raw.name),
    ...(note ? { note } : {}),
  };
}

export async function GET(req: Request) {
  await ensureSchema();
  const { searchParams } = new URL(req.url);
  const sql = getDb();

  // Today's numbered orders (Vietnam time), oldest first, for the kitchen view.
  // Orders from before numbering existed are skipped so they don't show as pending.
  if (searchParams.get("view") === "today") {
    const rows = await sql`
      SELECT id, order_no, items, total, method, staff, done, created_at
      FROM orders
      WHERE created_at >= (date_trunc('day', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') AT TIME ZONE 'Asia/Ho_Chi_Minh')
        AND order_no IS NOT NULL
      ORDER BY created_at ASC
    `;
    return Response.json({ orders: rows });
  }

  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = 20;
  const offset = (page - 1) * limit;

  const rows = await sql`
    SELECT id, order_no, items, total, method, staff, done, created_at
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

  const { items, total, method, staff } = body as {
    items?: unknown[];
    total?: number;
    method?: string;
    staff?: string;
  };

  if (!Array.isArray(items) || items.length === 0) {
    return Response.json({ error: "Items required" }, { status: 400 });
  }

  if (items.some((i) => typeof i !== "object" || i === null)) {
    return Response.json({ error: "Invalid items or prices" }, { status: 400 });
  }

  if (typeof total !== "number" || total <= 0) {
    return Response.json({ error: "Invalid total" }, { status: 400 });
  }

  if (!method || !VALID_METHODS.includes(method as PayMethod)) {
    return Response.json({ error: "Invalid payment method" }, { status: 400 });
  }

  const cleanItems = (items as RawItem[]).map(normalizeItem);

  // Server-side price validation
  const validation = validateOrderTotal(cleanItems);

  if (!validation.valid) {
    return Response.json({ error: "Invalid items or prices" }, { status: 400 });
  }

  if (validation.calculated !== total) {
    return Response.json(
      { error: "Total mismatch", expected: validation.calculated },
      { status: 400 }
    );
  }

  await ensureSchema();
  const sql = getDb();
  const [, inserted] = await sql.transaction([
    sql`SELECT pg_advisory_xact_lock(${ORDER_NO_LOCK_KEY})`,
    sql`
      INSERT INTO orders (items, total, method, staff, order_no)
      VALUES (
        ${JSON.stringify(cleanItems)}::jsonb,
        ${total},
        ${method},
        ${staff || null},
        (
          SELECT COALESCE(MAX(order_no), 0) + 1
          FROM orders
          WHERE created_at >= (date_trunc('day', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') AT TIME ZONE 'Asia/Ho_Chi_Minh')
        )
      )
      RETURNING id, order_no, created_at
    `,
  ]);

  return Response.json({ ok: true, order: inserted[0] });
}

/** Tick or untick one item of an order as made. Body: { id, index, done }. */
export async function PATCH(req: Request) {
  if (!(await isLoggedIn())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | { id?: unknown; index?: unknown; done?: unknown }
    | null;
  const id = Number(body?.id);
  const index = Number(body?.index);
  const done = body?.done;

  if (!Number.isInteger(id) || !Number.isInteger(index) || index < 0 || typeof done !== "boolean") {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  await ensureSchema();
  const sql = getDb();
  const rows = await sql`
    UPDATE orders
    SET done = CASE
      WHEN ${done}::boolean THEN (
        SELECT jsonb_agg(DISTINCT v ORDER BY v)
        FROM jsonb_array_elements(done || to_jsonb(${index}::int)) AS v
      )
      ELSE COALESCE(
        (SELECT jsonb_agg(v) FROM jsonb_array_elements(done) AS v WHERE v <> to_jsonb(${index}::int)),
        '[]'::jsonb
      )
    END
    WHERE id = ${id} AND ${index}::int < jsonb_array_length(items)
    RETURNING id, done
  `;

  if (rows.length === 0) {
    return Response.json({ error: "Order or item not found" }, { status: 404 });
  }

  return Response.json({ ok: true, done: rows[0].done });
}

export async function DELETE(req: Request) {
  if (!(await isLoggedIn())) {
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
