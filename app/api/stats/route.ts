import { cookies } from "next/headers";
import { getDb } from "@/lib/db";

function dateRange(range: string, now: Date, customFrom?: string, customTo?: string) {
  let start: string;
  let end: string;
  let prevStart: string;
  let prevEnd: string;

  if (range === "custom" && customFrom) {
    const from = new Date(customFrom);
    from.setHours(0, 0, 0, 0);
    start = from.toISOString();

    if (customTo) {
      const to = new Date(customTo);
      to.setHours(23, 59, 59, 999);
      end = to.toISOString();
    } else {
      // Single day
      const to = new Date(from);
      to.setDate(from.getDate() + 1);
      end = to.toISOString();
    }

    // Previous period = same duration before start
    const durationMs = new Date(end).getTime() - new Date(start).getTime();
    const prevEndDate = new Date(start);
    const prevStartDate = new Date(prevEndDate.getTime() - durationMs);
    prevStart = prevStartDate.toISOString();
    prevEnd = prevEndDate.toISOString();
  } else if (range === "yesterday") {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    start = yesterday.toISOString();
    end = today.toISOString();
    // Compare with day before yesterday
    const dayBefore = new Date(yesterday);
    dayBefore.setDate(yesterday.getDate() - 1);
    prevStart = dayBefore.toISOString();
    prevEnd = start;
  } else if (range === "week") {
    const day = now.getDay();
    const mon = new Date(now);
    mon.setDate(now.getDate() - ((day + 6) % 7));
    mon.setHours(0, 0, 0, 0);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 7);
    start = mon.toISOString();
    end = sun.toISOString();
    const prevMon = new Date(mon);
    prevMon.setDate(mon.getDate() - 7);
    prevStart = prevMon.toISOString();
    prevEnd = start;
  } else if (range === "month") {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    start = first.toISOString();
    end = last.toISOString();
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
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    prevStart = yesterday.toISOString();
    prevEnd = start;
  }

  return { start, end, prevStart: prevStart!, prevEnd: prevEnd! };
}

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const session = cookieStore.get("pos_session");
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const user = JSON.parse(session.value);
    if (user.role !== "admin") {
      return Response.json({ error: "Admin only" }, { status: 403 });
    }
  } catch {
    return Response.json({ error: "Invalid session" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "today";
  const customFrom = searchParams.get("from") || undefined;
  const customTo = searchParams.get("to") || undefined;
  const sql = getDb();
  const now = new Date();
  const { start, end, prevStart, prevEnd } = dateRange(range, now, customFrom, customTo);

  const [summary, prevSummary, daily, hourly, topItems, categoryBreakdown, paymentCounts] =
    await Promise.all([
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
      sql`
        SELECT
          COUNT(*)::int AS order_count,
          COALESCE(SUM(total), 0)::bigint AS revenue
        FROM orders
        WHERE created_at >= ${prevStart} AND created_at < ${prevEnd}
      `,
      sql`
        SELECT
          created_at::date AS date,
          COUNT(*)::int AS order_count,
          SUM(total)::bigint AS revenue
        FROM orders
        WHERE created_at >= ${start} AND created_at < ${end}
        GROUP BY created_at::date
        ORDER BY date ASC
        LIMIT 90
      `,
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
