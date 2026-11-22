import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import {
  businessDateOf,
  businessDayStart,
  businessDayStartFromString,
  DAY_START_HOUR,
  EVENING_SHIFT_START_HOUR,
} from "@/lib/business-day";

/**
 * Date ranges use working days (07:00 to 07:00 Vietnam time), so the evening
 * shift's after-midnight sales count toward the day it started.
 */
function dateRange(range: string, now: Date, customFrom?: string, customTo?: string) {
  const today = businessDateOf(now);
  const day = (offset: number) => businessDayStart(today.y, today.m, today.d + offset);

  let start: Date;
  let end: Date;
  let prevStart: Date;
  let prevEnd: Date;

  const fromDay = customFrom ? businessDayStartFromString(customFrom) : null;

  if (range === "custom" && fromDay) {
    start = fromDay;
    const toDay = customTo ? businessDayStartFromString(customTo) : null;
    // `to` is inclusive: the range ends when the day after it starts
    end = new Date((toDay ?? fromDay).getTime() + 86_400_000);
    // Previous period = same duration before start
    const durationMs = end.getTime() - start.getTime();
    prevEnd = start;
    prevStart = new Date(start.getTime() - durationMs);
  } else if (range === "yesterday") {
    start = day(-1);
    end = day(0);
    prevStart = day(-2);
    prevEnd = start;
  } else if (range === "week") {
    const sinceMonday = (today.weekday + 6) % 7;
    start = day(-sinceMonday);
    end = day(7 - sinceMonday);
    prevStart = day(-sinceMonday - 7);
    prevEnd = start;
  } else if (range === "month") {
    start = businessDayStart(today.y, today.m, 1);
    end = businessDayStart(today.y, today.m + 1, 1);
    prevStart = businessDayStart(today.y, today.m - 1, 1);
    prevEnd = start;
  } else {
    // today
    start = day(0);
    end = day(1);
    prevStart = day(-1);
    prevEnd = start;
  }

  return {
    start: start.toISOString(),
    end: end.toISOString(),
    prevStart: prevStart.toISOString(),
    prevEnd: prevEnd.toISOString(),
  };
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
  await ensureSchema();
  const sql = getDb();
  const now = new Date();
  const { start, end, prevStart, prevEnd } = dateRange(range, now, customFrom, customTo);

  const [summary, prevSummary, daily, hourly, shifts, topItems, categoryBreakdown, paymentCounts, deleted] =
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
        WHERE created_at >= ${start} AND created_at < ${end} AND deleted_at IS NULL
      `,
      sql`
        SELECT
          COUNT(*)::int AS order_count,
          COALESCE(SUM(total), 0)::bigint AS revenue
        FROM orders
        WHERE created_at >= ${prevStart} AND created_at < ${prevEnd} AND deleted_at IS NULL
      `,
      sql`
        SELECT
          ((created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') - make_interval(hours => ${DAY_START_HOUR}))::date AS date,
          COUNT(*)::int AS order_count,
          SUM(total)::bigint AS revenue
        FROM orders
        WHERE created_at >= ${start} AND created_at < ${end} AND deleted_at IS NULL
        GROUP BY 1
        ORDER BY date ASC
        LIMIT 90
      `,
      sql`
        SELECT
          EXTRACT(HOUR FROM created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::int AS hour,
          COUNT(*)::int AS order_count,
          SUM(total)::bigint AS revenue
        FROM orders
        WHERE created_at >= ${start} AND created_at < ${end} AND deleted_at IS NULL
        GROUP BY 1
        ORDER BY hour
      `,
      sql`
        SELECT
          CASE
            WHEN EXTRACT(HOUR FROM created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::int >= ${DAY_START_HOUR}::int
             AND EXTRACT(HOUR FROM created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::int < ${EVENING_SHIFT_START_HOUR}::int
            THEN 'morning'
            ELSE 'evening'
          END AS shift,
          COUNT(*)::int AS order_count,
          COALESCE(SUM(total), 0)::bigint AS revenue
        FROM orders
        WHERE created_at >= ${start} AND created_at < ${end} AND deleted_at IS NULL
        GROUP BY 1
      `,
      sql`
        SELECT
          item->>'name' AS name,
          SUM((item->>'qty')::int)::int AS qty,
          SUM((item->>'price')::bigint * (item->>'qty')::int)::bigint AS revenue
        FROM orders, jsonb_array_elements(items) AS item
        WHERE created_at >= ${start} AND created_at < ${end} AND deleted_at IS NULL
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
        WHERE created_at >= ${start} AND created_at < ${end} AND deleted_at IS NULL
        GROUP BY item->>'name'
      `,
      sql`
        SELECT
          method,
          COUNT(*)::int AS count
        FROM orders
        WHERE created_at >= ${start} AND created_at < ${end} AND deleted_at IS NULL
        GROUP BY method
      `,
      // Orders created in this range that were later deleted
      sql`
        SELECT COUNT(*)::int AS order_count, COALESCE(SUM(total), 0)::bigint AS revenue
        FROM orders
        WHERE created_at >= ${start} AND created_at < ${end} AND deleted_at IS NOT NULL
      `,
    ]);

  return Response.json({
    range,
    summary: summary[0],
    prevSummary: prevSummary[0],
    daily,
    hourly,
    shifts,
    topItems,
    categoryBreakdown,
    paymentCounts,
    deleted: deleted[0],
  });
}
