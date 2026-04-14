import { cookies } from "next/headers";
import { getDb } from "@/lib/db";

export async function GET(req: Request) {
  // Auth check: require owner cookie
  const cookieStore = await cookies();
  const auth = cookieStore.get("owner_auth");
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "today";
  const sql = getDb();

  const now = new Date();
  let start: string;
  let end: string;

  if (range === "week") {
    const day = now.getDay();
    const mon = new Date(now);
    mon.setDate(now.getDate() - ((day + 6) % 7));
    mon.setHours(0, 0, 0, 0);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 7);
    start = mon.toISOString();
    end = sun.toISOString();
  } else if (range === "month") {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    start = first.toISOString();
    end = last.toISOString();
  } else {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    start = today.toISOString();
    end = tomorrow.toISOString();
  }

  const summary = await sql`
    SELECT
      COUNT(*)::int AS order_count,
      COALESCE(SUM(total), 0)::bigint AS revenue,
      COALESCE(SUM(CASE WHEN method = 'cash' THEN total ELSE 0 END), 0)::bigint AS cash_revenue,
      COALESCE(SUM(CASE WHEN method = 'transfer' THEN total ELSE 0 END), 0)::bigint AS transfer_revenue,
      COALESCE(SUM(CASE WHEN method = 'card' THEN total ELSE 0 END), 0)::bigint AS card_revenue
    FROM orders
    WHERE created_at >= ${start} AND created_at < ${end}
  `;

  const daily = await sql`
    SELECT
      created_at::date AS date,
      COUNT(*)::int AS order_count,
      SUM(total)::bigint AS revenue
    FROM orders
    WHERE created_at >= ${start} AND created_at < ${end}
    GROUP BY created_at::date
    ORDER BY date DESC
    LIMIT 31
  `;

  const topItems = await sql`
    SELECT
      item->>'name' AS name,
      SUM((item->>'qty')::int)::int AS qty,
      SUM((item->>'price')::bigint * (item->>'qty')::int)::bigint AS revenue
    FROM orders, jsonb_array_elements(items) AS item
    WHERE created_at >= ${start} AND created_at < ${end}
    GROUP BY item->>'name'
    ORDER BY qty DESC
    LIMIT 10
  `;

  return Response.json({
    range,
    summary: summary[0],
    daily,
    topItems,
  });
}
