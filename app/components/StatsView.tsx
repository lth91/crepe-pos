"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { StatsData } from "@/lib/types";
import { fmt, fmtDate, MENU, CAT_ICONS } from "@/lib/menu";

// ── Helpers ──────────────────────────────────────────────────────────
function pct(value: number, total: number) {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

function changeLabel(current: number, previous: number) {
  if (previous === 0) return current > 0 ? "+100%" : "0%";
  const diff = ((current - previous) / previous) * 100;
  const sign = diff >= 0 ? "+" : "";
  return `${sign}${Math.round(diff)}%`;
}

function changeColor(current: number, previous: number) {
  if (current > previous) return "text-green-600";
  if (current < previous) return "text-red-500";
  return "text-gray-400";
}

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

const ITEM_TO_CATEGORY = new Map<string, string>();
for (const [cat, items] of Object.entries(MENU)) {
  for (const item of items) {
    ITEM_TO_CATEGORY.set(item.name, cat);
  }
}

const CAT_COLORS: Record<string, string> = {
  "Sweet Crepes": "bg-amber-500",
  "Savory Crepes": "bg-orange-500",
  "Ice Cream": "bg-cyan-500",
  Drinks: "bg-blue-500",
  Topping: "bg-yellow-500",
};

const CAT_TEXT_COLORS: Record<string, string> = {
  "Sweet Crepes": "text-amber-700",
  "Savory Crepes": "text-orange-700",
  "Ice Cream": "text-cyan-700",
  Drinks: "text-blue-700",
  Topping: "text-yellow-700",
};

type RangeType = "today" | "yesterday" | "week" | "month" | "custom";

// ── Component ────────────────────────────────────────────────────────
export function StatsView({
  onBack,
  onHistory,
}: {
  onBack: () => void;
  onHistory: () => void;
}) {
  const [range, setRange] = useState<RangeType>("today");
  const [customFrom, setCustomFrom] = useState(toDateStr(new Date()));
  const [customTo, setCustomTo] = useState(toDateStr(new Date()));
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(
    async (r: RangeType, from?: string, to?: string) => {
      setLoading(true);
      setError(null);
      try {
        let url = `/api/stats?range=${r}`;
        if (r === "custom" && from) {
          url += `&from=${from}`;
          if (to) url += `&to=${to}`;
        }
        const res = await fetch(url);
        if (!res.ok) {
          if (res.status === 401) {
            onBack();
            return;
          }
          throw new Error("Không thể tải dữ liệu thống kê");
        }
        setData(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    },
    [onBack]
  );

  useEffect(() => {
    if (range === "custom") {
      fetchStats("custom", customFrom, customTo);
    } else {
      fetchStats(range);
    }
  }, [range, customFrom, customTo, fetchStats]);

  const categoryData = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, { qty: number; revenue: number }>();
    for (const item of data.categoryBreakdown) {
      const cat = ITEM_TO_CATEGORY.get(item.name) || "Khác";
      const prev = map.get(cat) || { qty: 0, revenue: 0 };
      map.set(cat, {
        qty: prev.qty + Number(item.qty),
        revenue: prev.revenue + Number(item.revenue),
      });
    }
    return Array.from(map.entries())
      .map(([name, vals]) => ({ name, ...vals }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [data]);

  const rangeLabels: Record<RangeType, string> = {
    today: "Hôm nay",
    yesterday: "Hôm qua",
    week: "Tuần này",
    month: "Tháng này",
    custom: "Tùy chọn",
  };

  const prevLabels: Record<RangeType, string> = {
    today: "hôm qua",
    yesterday: "hôm kia",
    week: "tuần trước",
    month: "tháng trước",
    custom: "kỳ trước",
  };

  // Quick date shortcuts for custom mode
  function setQuickRange(label: string) {
    const now = new Date();
    let from: Date;
    const to = new Date();

    switch (label) {
      case "7d":
        from = new Date(now);
        from.setDate(now.getDate() - 6);
        break;
      case "14d":
        from = new Date(now);
        from.setDate(now.getDate() - 13);
        break;
      case "30d":
        from = new Date(now);
        from.setDate(now.getDate() - 29);
        break;
      case "90d":
        from = new Date(now);
        from.setDate(now.getDate() - 89);
        break;
      case "thisYear":
        from = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return;
    }
    setCustomFrom(toDateStr(from));
    setCustomTo(toDateStr(to));
    setRange("custom");
  }

  // Format the custom range description
  const customRangeDesc = useMemo(() => {
    if (range !== "custom") return "";
    if (customFrom === customTo) {
      return new Date(customFrom).toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }
    const f = new Date(customFrom).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
    const t = new Date(customTo).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    return `${f} — ${t}`;
  }, [range, customFrom, customTo]);

  return (
    <div className="flex min-h-dvh flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-amber-700 px-4 pb-3 pt-3 text-white">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-2xl active:opacity-70">
            ←
          </button>
          <h1 className="flex-1 text-lg font-bold">Thống kê doanh thu</h1>
          <button
            onClick={onHistory}
            className="flex items-center gap-1.5 rounded-xl bg-amber-600/50 px-3 py-2 text-sm font-medium active:bg-amber-600"
          >
            📋 Lịch sử
          </button>
        </div>
      </div>

      {/* Range Tabs */}
      <div className="bg-amber-700 px-3 pb-3">
        <div className="flex gap-1.5">
          {(["today", "yesterday", "week", "month", "custom"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                range === r
                  ? "bg-white text-amber-700 shadow-md"
                  : "bg-amber-600/50 text-amber-100 active:bg-amber-600"
              }`}
            >
              {rangeLabels[r]}
            </button>
          ))}
        </div>

        {/* Custom date picker */}
        {range === "custom" && (
          <div className="mt-3 space-y-2">
            {/* Quick shortcuts */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "7 ngày", key: "7d" },
                { label: "14 ngày", key: "14d" },
                { label: "30 ngày", key: "30d" },
                { label: "90 ngày", key: "90d" },
                { label: "Năm nay", key: "thisYear" },
              ].map((s) => (
                <button
                  key={s.key}
                  onClick={() => setQuickRange(s.key)}
                  className="rounded-lg bg-amber-600/50 px-3 py-1.5 text-xs font-medium text-amber-100 active:bg-amber-600"
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Date inputs */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-[10px] uppercase text-amber-300">Từ ngày</label>
                <input
                  type="date"
                  value={customFrom}
                  max={customTo}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full rounded-xl bg-amber-600/50 px-3 py-2.5 text-sm font-medium text-white outline-none focus:ring-2 focus:ring-amber-300 [color-scheme:dark]"
                />
              </div>
              <span className="mt-4 text-amber-300">→</span>
              <div className="flex-1">
                <label className="mb-1 block text-[10px] uppercase text-amber-300">Đến ngày</label>
                <input
                  type="date"
                  value={customTo}
                  min={customFrom}
                  max={toDateStr(new Date())}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full rounded-xl bg-amber-600/50 px-3 py-2.5 text-sm font-medium text-white outline-none focus:ring-2 focus:ring-amber-300 [color-scheme:dark]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-300 border-t-amber-700" />
        </div>
      ) : error ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4">
          <p className="text-center text-gray-500">{error}</p>
          <button
            onClick={() =>
              range === "custom"
                ? fetchStats("custom", customFrom, customTo)
                : fetchStats(range)
            }
            className="rounded-xl bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white active:bg-amber-700"
          >
            Thử lại
          </button>
        </div>
      ) : data && data.summary.order_count === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8">
          <span className="text-5xl">📊</span>
          <p className="text-lg font-semibold text-gray-400">Chưa có đơn hàng nào</p>
          <p className="text-sm text-gray-300">
            {range === "custom" ? customRangeDesc : rangeLabels[range]}
          </p>
        </div>
      ) : data ? (
        <div className="flex-1 overflow-y-auto pb-8">
          {/* ── Hero Revenue Card ─────────────────────────────────── */}
          <div className="-mt-1 rounded-b-3xl bg-amber-700 px-4 pb-6 pt-2">
            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-200">Tổng doanh thu</p>
                  <p className="mt-1 text-4xl font-extrabold text-white">
                    {fmt(Number(data.summary.revenue))}
                  </p>
                </div>
                {range === "custom" && (
                  <p className="rounded-lg bg-white/10 px-2.5 py-1 text-xs text-amber-200">
                    {customRangeDesc}
                  </p>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`text-sm font-semibold ${
                    Number(data.summary.revenue) >= Number(data.prevSummary.revenue)
                      ? "text-green-300"
                      : "text-red-300"
                  }`}
                >
                  {changeLabel(
                    Number(data.summary.revenue),
                    Number(data.prevSummary.revenue)
                  )}
                </span>
                <span className="text-xs text-amber-300">so với {prevLabels[range]}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-4">
            {/* ── KPI Cards ──────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-3">
              <KPICard
                label="Số đơn"
                value={String(data.summary.order_count)}
                sub={changeLabel(data.summary.order_count, data.prevSummary.order_count)}
                subColor={changeColor(data.summary.order_count, data.prevSummary.order_count)}
              />
              <KPICard label="TB/đơn" value={fmt(data.summary.avg_order)} />
              <KPICard label="Cao nhất" value={fmt(data.summary.max_order)} />
            </div>

            {/* ── Payment Breakdown ──────────────────────────────── */}
            <Section title="Phương thức thanh toán">
              <PaymentBar data={data} />
              <div className="mt-3 grid grid-cols-3 gap-2">
                <PaymentCard
                  label="Tiền mặt"
                  amount={Number(data.summary.cash_revenue)}
                  count={data.paymentCounts.find((p) => p.method === "cash")?.count || 0}
                  color="bg-green-500"
                  textColor="text-green-700"
                />
                <PaymentCard
                  label="Chuyển khoản"
                  amount={Number(data.summary.transfer_revenue)}
                  count={data.paymentCounts.find((p) => p.method === "transfer")?.count || 0}
                  color="bg-blue-500"
                  textColor="text-blue-700"
                />
                <PaymentCard
                  label="Thẻ"
                  amount={Number(data.summary.card_revenue)}
                  count={data.paymentCounts.find((p) => p.method === "card")?.count || 0}
                  color="bg-purple-500"
                  textColor="text-purple-700"
                />
              </div>
            </Section>

            {/* ── Hourly Chart ───────────────────────────────────── */}
            {data.hourly.length > 0 && (
              <Section title="Doanh thu theo giờ">
                <HourlyChart hourly={data.hourly} />
              </Section>
            )}

            {/* ── Daily Chart ────────────────────────────────────── */}
            {data.daily.length > 0 && (
              <Section title="Doanh thu theo ngày">
                <DailyChart daily={data.daily} />
              </Section>
            )}

            {/* ── Category Breakdown ─────────────────────────────── */}
            {categoryData.length > 0 && (
              <Section title="Doanh thu theo danh mục">
                <CategoryChart categories={categoryData} total={Number(data.summary.revenue)} />
              </Section>
            )}

            {/* ── Top Items ──────────────────────────────────────── */}
            {data.topItems.length > 0 && (
              <Section title="Món bán chạy nhất">
                <TopItemsList items={data.topItems} />
              </Section>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ── Sub Components ───────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-400">{title}</h3>
      {children}
    </div>
  );
}

function KPICard({
  label,
  value,
  sub,
  subColor,
}: {
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
}) {
  return (
    <div className="rounded-xl bg-white p-3 shadow-sm">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-0.5 text-lg font-bold text-gray-800">{value}</p>
      {sub && (
        <p className={`mt-0.5 text-xs font-semibold ${subColor || "text-gray-400"}`}>{sub}</p>
      )}
    </div>
  );
}

function PaymentBar({ data }: { data: StatsData }) {
  const total = Number(data.summary.revenue);
  if (total === 0) return null;
  const cash = pct(Number(data.summary.cash_revenue), total);
  const transfer = pct(Number(data.summary.transfer_revenue), total);
  const card = 100 - cash - transfer;

  return (
    <div className="flex h-4 overflow-hidden rounded-full bg-gray-100">
      {cash > 0 && (
        <div className="bg-green-500 transition-all duration-500" style={{ width: `${cash}%` }} />
      )}
      {transfer > 0 && (
        <div
          className="bg-blue-500 transition-all duration-500"
          style={{ width: `${transfer}%` }}
        />
      )}
      {card > 0 && (
        <div
          className="bg-purple-500 transition-all duration-500"
          style={{ width: `${card}%` }}
        />
      )}
    </div>
  );
}

function PaymentCard({
  label,
  amount,
  count,
  color,
  textColor,
}: {
  label: string;
  amount: number;
  count: number;
  color: string;
  textColor: string;
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-2.5">
      <div className="flex items-center gap-1.5">
        <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className={`mt-1 text-sm font-bold ${textColor}`}>{fmt(amount)}</p>
      <p className="text-xs text-gray-400">{count} đơn</p>
    </div>
  );
}

function HourlyChart({ hourly }: { hourly: StatsData["hourly"] }) {
  const maxRevenue = Math.max(...hourly.map((h) => Number(h.revenue)), 1);
  const hours = Array.from({ length: 24 }, (_, i) => {
    const found = hourly.find((h) => h.hour === i);
    return {
      hour: i,
      revenue: found ? Number(found.revenue) : 0,
      orders: found ? found.order_count : 0,
    };
  });
  const visibleHours = hours.filter((h) => h.hour >= 7 && h.hour <= 23);

  return (
    <div>
      <div className="flex items-end gap-1" style={{ height: 120 }}>
        {visibleHours.map((h) => {
          const height = maxRevenue > 0 ? (h.revenue / maxRevenue) * 100 : 0;
          const isActive = h.revenue > 0;
          return (
            <div key={h.hour} className="group relative flex flex-1 flex-col items-center">
              <div
                className={`w-full rounded-t-sm transition-all duration-300 ${
                  isActive ? "bg-amber-500 group-hover:bg-amber-600" : "bg-gray-100"
                }`}
                style={{ height: `${Math.max(height, 2)}%` }}
              />
              {isActive && (
                <div className="pointer-events-none absolute -top-14 z-10 hidden rounded-lg bg-gray-800 px-2 py-1 text-xs text-white shadow-lg group-hover:block">
                  <p className="font-semibold">{fmt(h.revenue)}</p>
                  <p className="text-gray-300">{h.orders} đơn</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex gap-1">
        {visibleHours.map((h) => (
          <div key={h.hour} className="flex-1 text-center text-[10px] text-gray-400">
            {h.hour % 2 === 0 ? `${h.hour}h` : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

function DailyChart({ daily }: { daily: StatsData["daily"] }) {
  const maxRevenue = Math.max(...daily.map((d) => Number(d.revenue)), 1);

  return (
    <div className="space-y-2">
      {daily.map((d) => {
        const width = pct(Number(d.revenue), maxRevenue);
        return (
          <div key={d.date} className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-xs text-gray-500">{fmtDate(d.date)}</span>
            <div className="flex-1">
              <div className="h-6 overflow-hidden rounded-lg bg-gray-100">
                <div
                  className="flex h-full items-center rounded-lg bg-amber-500 px-2 transition-all duration-500"
                  style={{ width: `${Math.max(width, 8)}%` }}
                >
                  {width > 30 && (
                    <span className="text-xs font-semibold text-white">
                      {fmt(Number(d.revenue))}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="w-20 shrink-0 text-right">
              {width <= 30 && (
                <span className="text-xs font-semibold text-gray-700">
                  {fmt(Number(d.revenue))}
                </span>
              )}
              <p className="text-[10px] text-gray-400">{d.order_count} đơn</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CategoryChart({
  categories,
  total,
}: {
  categories: { name: string; qty: number; revenue: number }[];
  total: number;
}) {
  return (
    <div className="space-y-3">
      <div className="flex h-5 overflow-hidden rounded-full bg-gray-100">
        {categories.map((cat) => {
          const w = pct(cat.revenue, total);
          if (w === 0) return null;
          return (
            <div
              key={cat.name}
              className={`${CAT_COLORS[cat.name] || "bg-gray-400"} transition-all duration-500`}
              style={{ width: `${w}%` }}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {categories.map((cat) => {
          const percentage = pct(cat.revenue, total);
          return (
            <div key={cat.name} className="flex items-start gap-2 rounded-xl bg-gray-50 p-3">
              <div
                className={`mt-0.5 h-3 w-3 shrink-0 rounded-full ${CAT_COLORS[cat.name] || "bg-gray-400"}`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-600">
                  {CAT_ICONS[cat.name] || ""} {cat.name}
                </p>
                <p
                  className={`text-sm font-bold ${CAT_TEXT_COLORS[cat.name] || "text-gray-700"}`}
                >
                  {fmt(cat.revenue)}
                </p>
                <p className="text-[10px] text-gray-400">
                  {cat.qty} món · {percentage}%
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TopItemsList({ items }: { items: StatsData["topItems"] }) {
  const maxQty = Math.max(...items.map((i) => i.qty), 1);

  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const barWidth = pct(item.qty, maxQty);
        const cat = ITEM_TO_CATEGORY.get(item.name);
        const barColor = cat ? CAT_COLORS[cat] || "bg-amber-500" : "bg-amber-500";

        return (
          <div key={item.name} className="flex items-center gap-2.5">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                i < 3 ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-500"
              }`}
            >
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="truncate text-sm font-medium text-gray-700">{item.name}</span>
                <span className="ml-2 shrink-0 text-xs font-semibold text-amber-700">
                  {fmt(Number(item.revenue))}
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full ${barColor} transition-all duration-500`}
                  style={{ width: `${Math.max(barWidth, 4)}%` }}
                />
              </div>
              <p className="mt-0.5 text-[10px] text-gray-400">
                x{item.qty} · {cat || ""}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
