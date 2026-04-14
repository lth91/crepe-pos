import { cookies } from "next/headers";
import { getDb } from "@/lib/db";

function dateRange(range: string, now: Date) {
  let start: string;
  let end: string;
  let prevStart: string;
  let prevEnd: string;

  if (range === "week") {
    const day = now.getDay();
    const mon = new Date(now);
    mon.setDate(now.getDate() - ((day + 6) % 7));
    mon.setHours(0, 0, 0, 0);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 7);
    start = mon.toISOString();
    end = sun.toISOString();
    // Previous week
    const prevMon = new Date(mon);
    prevMon.setDate(mon.getDate() - 7);
    prevStart = prevMon.toISOString();
    prevEnd = start;
  } else if (range === "month") {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    start = first.toISOString();
    end = last.toISOString();
    // Previous month
    const prevFirst = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    prevStart = prevFirst.toISOString();
    prevEnd = start;
  } else {
    // today
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    start = today.toISOString();
    end = tomorrow.toISOString();
    // Yesterday
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    prevStart = yesterday.toISOString();
    prevEnd = start;
  }

  return { start, end, prevStart: prevStart!, prevEnd: prevEnd! };
}

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const auth = cookieStore.get("owner_auth");
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "today";
  const sql = getDb();
  const now = new Date();
  const { start, end, prevStart, prevEnd } = dateRange(range, now);

  // Run all queries in parallel
  const [summary, prevSummary, daily, hourly, topItems, categoryBreakdown, paymentCounts] =
    await Promise.all([
      // Current period summary
      sql`
        SELECT
          COUNT(*)::int AS order_count,
          COALESCE(SUM(total), 0)::bigint AS revenue,
          COALESCE(AVG(total), 0)::int AS avg_order,
          COALESCE(MIN(total), 0)::int AS min_order,
          COALESCE(MAX(total), 0)::int AS max_order,
          COALESCE(SUM(CASE WHEN method = 'cash' THEN total ELSE 0 END), 0)::bigint AS cash_revenue,
          COALESCE(SUM(CASE WHEN method = 'transfer' THEN total ELSE 0 END), 0)::bigint AS transfer_revenue,
          COALESCE(SUM(CASE WHEN method = 'card' THEN total ELSE 0 END), 0)::bigint AS card_revenue
        FROM orders
        WHERE created_at >= ${start} AND created_at < ${end}
      `,
      // Previous period summary (for comparison)
      sql`
        SELECT
          COUNT(*)::int AS order_count,
          COALESCE(SUM(total), 0)::bigint AS revenue
        FROM orders
        WHERE created_at >= ${prevStart} AND created_at < ${prevEnd}
      `,
      // Daily breakdown
      sql`
        SELECT
          created_at::date AS date,
          COUNT(*)::int AS order_count,
          SUM(total)::bigint AS revenue
        FROM orders
        WHERE created_at >= ${start} AND created_at < ${end}
        GROUP BY created_at::date
        ORDER BY date ASC
        LIMIT 31
      `,
      // Hourly breakdown
      sql`
        SELECT
          EXTRACT(HOUR FROM created_at)::int AS hour,
          COUNT(*)::int AS order_count,
          SUM(total)::bigint AS revenue
        FROM orders
        WHERE created_at >= ${start} AND created_at < ${end}
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY hour
      `,
      // Top items (expanded to 15)
      sql`
        SELECT
          item->>'name' AS name,
          SUM((item->>'qty')::int)::int AS qty,
          SUM((item->>'price')::bigint * (item->>'qty')::int)::bigint AS revenue
        FROM orders, jsonb_array_elements(items) AS item
        WHERE created_at >= ${start} AND created_at < ${end}
        GROUP BY item->>'name'
        ORDER BY qty DESC
        LIMIT 15
      `,
      // Category breakdown (based on item prices mapped to categories)
      sql`
        SELECT
          item->>'name' AS name,
          SUM((item->>'qty')::int)::int AS qty,
          SUM(
            ((item->>'price')::bigint * (item->>'qty')::int)
          )::bigint AS revenue
        FROM orders, jsonb_array_elements(items) AS item
        WHERE created_at >= ${start} AND created_at < ${end}
        GROUP BY item->>'name'
      `,
      // Payment method counts
      sql`
        SELECT
          method,
          COUNT(*)::int AS count
        FROM orders
        WHERE created_at >= ${start} AND created_at < ${end}
        GROUP BY method
      `,
    ]);

  return Response.json({
    range,
    summary: summary[0],
    prevSummary: prevSummary[0],
    daily,
    hourly,
    topItems,
    categoryBreakdown,
    paymentCounts,
  });
}
