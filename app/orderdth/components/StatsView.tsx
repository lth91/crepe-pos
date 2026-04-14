"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { StatsData } from "@/lib/types";
import { fmt, fmtDate, MENU } from "@/lib/menu";
import { ArrowLeft, ClipboardList, RotateCcw, Loader2, CategoryIcon } from "@/lib/icons";

function pct(value: number, total: number) {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

function changeLabel(current: number, previous: number) {
  if (previous === 0) return current > 0 ? "+100%" : "—";
  const diff = ((current - previous) / previous) * 100;
  const sign = diff >= 0 ? "+" : "";
  return `${sign}${Math.round(diff)}%`;
}

function changeColor(current: number, previous: number) {
  if (current > previous) return "text-green-600";
  if (current < previous) return "text-red-500";
  return "text-zinc-400";
}

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

const ITEM_TO_CATEGORY = new Map<string, string>();
for (const [cat, items] of Object.entries(MENU)) {
  for (const item of items) ITEM_TO_CATEGORY.set(item.name, cat);
}

const CAT_COLORS: Record<string, string> = {
  "Sweet Crepes": "bg-amber-400",
  "Savory Crepes": "bg-orange-400",
  "Ice Cream": "bg-cyan-400",
  Drinks: "bg-blue-400",
  Topping: "bg-yellow-400",
};

const CAT_DOT: Record<string, string> = {
  "Sweet Crepes": "bg-amber-500",
  "Savory Crepes": "bg-orange-500",
  "Ice Cream": "bg-cyan-500",
  Drinks: "bg-blue-500",
  Topping: "bg-yellow-500",
};

type RangeType = "today" | "yesterday" | "week" | "month" | "custom";

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
          if (res.status === 401) { onBack(); return; }
          throw new Error("Không thể tải dữ liệu");
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
    if (range === "custom") fetchStats("custom", customFrom, customTo);
    else fetchStats(range);
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

  const labels: Record<RangeType, string> = {
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

  function setQuickRange(key: string) {
    const now = new Date();
    let from: Date;
    switch (key) {
      case "7d": from = new Date(now); from.setDate(now.getDate() - 6); break;
      case "14d": from = new Date(now); from.setDate(now.getDate() - 13); break;
      case "30d": from = new Date(now); from.setDate(now.getDate() - 29); break;
      case "90d": from = new Date(now); from.setDate(now.getDate() - 89); break;
      case "thisYear": from = new Date(now.getFullYear(), 0, 1); break;
      default: return;
    }
    setCustomFrom(toDateStr(from));
    setCustomTo(toDateStr(now));
    setRange("custom");
  }

  const customRangeDesc = useMemo(() => {
    if (range !== "custom") return "";
    if (customFrom === customTo) {
      return new Date(customFrom).toLocaleDateString("vi-VN", {
        weekday: "long", day: "2-digit", month: "2-digit", year: "numeric",
      });
    }
    const f = new Date(customFrom).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
    const t = new Date(customTo).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    return `${f} — ${t}`;
  }, [range, customFrom, customTo]);

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-zinc-100 px-4 py-2.5 pt-safe">
        <button onClick={onBack} className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-400 active:bg-zinc-100"><ArrowLeft size={20} /></button>
        <h1 className="flex-1 text-base font-semibold text-zinc-900">Thống kê</h1>
        <button
          onClick={onHistory}
          className="flex h-11 items-center gap-1.5 rounded-xl border border-zinc-200 px-4 text-sm font-medium text-zinc-500 active:bg-zinc-50"
        >
          <ClipboardList size={15} /> Lịch sử
        </button>
      </header>

      {/* Range Tabs */}
      <div className="border-b border-zinc-100 px-4 py-2.5">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {(["today", "yesterday", "week", "month", "custom"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                range === r
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-500 active:bg-zinc-100"
              }`}
            >
              {labels[r]}
            </button>
          ))}
        </div>

        {range === "custom" && (
          <div className="mt-3 space-y-2.5 pb-1">
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
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 active:bg-zinc-50"
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                max={customTo}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
              />
              <span className="text-zinc-300">→</span>
              <input
                type="date"
                value={customTo}
                min={customFrom}
                max={toDateStr(new Date())}
                onChange={(e) => setCustomTo(e.target.value)}
                className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
              />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 size={20} className="animate-spin text-zinc-400" />
        </div>
      ) : error ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4">
          <p className="text-sm text-zinc-400">{error}</p>
          <button
            onClick={() => range === "custom" ? fetchStats("custom", customFrom, customTo) : fetchStats(range)}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white"
          >
            <RotateCcw size={13} /> Thử lại
          </button>
        </div>
      ) : data && data.summary.order_count === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 p-8">
          <p className="text-sm text-zinc-300">Chưa có đơn hàng nào</p>
          <p className="text-xs text-zinc-300">{range === "custom" ? customRangeDesc : labels[range]}</p>
        </div>
      ) : data ? (
        <div className="flex-1 overflow-y-auto">
          {/* Revenue Hero */}
          <div className="border-b border-zinc-100 px-4 py-5">
            <p className="text-xs font-medium text-zinc-400">Doanh thu</p>
            <p className="mt-1 text-3xl font-semibold text-zinc-900 tracking-tight">
              {fmt(Number(data.summary.revenue))}
            </p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className={`text-xs font-semibold ${
                Number(data.summary.revenue) >= Number(data.prevSummary.revenue)
                  ? "text-green-600" : "text-red-500"
              }`}>
                {changeLabel(Number(data.summary.revenue), Number(data.prevSummary.revenue))}
              </span>
              <span className="text-xs text-zinc-400">so với {prevLabels[range]}</span>
            </div>
            {range === "custom" && (
              <p className="mt-1 text-xs text-zinc-400">{customRangeDesc}</p>
            )}
          </div>

          <div className="space-y-0 divide-y divide-zinc-100">
            {/* KPIs */}
            <div className="grid grid-cols-3 divide-x divide-zinc-100">
              <div className="px-4 py-4">
                <p className="text-xs text-zinc-400">Số đơn</p>
                <p className="mt-0.5 text-xl font-semibold text-zinc-800">{data.summary.order_count}</p>
                <p className={`text-xs font-medium ${changeColor(data.summary.order_count, data.prevSummary.order_count)}`}>
                  {changeLabel(data.summary.order_count, data.prevSummary.order_count)}
                </p>
              </div>
              <div className="px-4 py-4">
                <p className="text-xs text-zinc-400">TB/đơn</p>
                <p className="mt-0.5 text-xl font-semibold text-zinc-800">{fmt(data.summary.avg_order)}</p>
              </div>
              <div className="px-4 py-4">
                <p className="text-xs text-zinc-400">Cao nhất</p>
                <p className="mt-0.5 text-xl font-semibold text-zinc-800">{fmt(data.summary.max_order)}</p>
              </div>
            </div>

            {/* Payment */}
            <div className="px-4 py-4">
              <SectionLabel>Thanh toán</SectionLabel>
              <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-zinc-100">
                {Number(data.summary.revenue) > 0 && (
                  <>
                    <div className="bg-emerald-400 transition-all" style={{ width: `${pct(Number(data.summary.cash_revenue), Number(data.summary.revenue))}%` }} />
                    <div className="bg-blue-400 transition-all" style={{ width: `${pct(Number(data.summary.transfer_revenue), Number(data.summary.revenue))}%` }} />
                    <div className="bg-violet-400 transition-all" style={{ width: `${pct(Number(data.summary.card_revenue), Number(data.summary.revenue))}%` }} />
                  </>
                )}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <PayItem label="Tiền mặt" amount={Number(data.summary.cash_revenue)} count={data.paymentCounts.find(p => p.method === "cash")?.count || 0} dot="bg-emerald-400" />
                <PayItem label="Chuyển khoản" amount={Number(data.summary.transfer_revenue)} count={data.paymentCounts.find(p => p.method === "transfer")?.count || 0} dot="bg-blue-400" />
                <PayItem label="Thẻ" amount={Number(data.summary.card_revenue)} count={data.paymentCounts.find(p => p.method === "card")?.count || 0} dot="bg-violet-400" />
              </div>
            </div>

            {/* Hourly */}
            {data.hourly.length > 0 && (
              <div className="px-4 py-4">
                <SectionLabel>Theo giờ</SectionLabel>
                <HourlyChart hourly={data.hourly} />
              </div>
            )}

            {/* Daily */}
            {data.daily.length > 0 && (
              <div className="px-4 py-4">
                <SectionLabel>Theo ngày</SectionLabel>
                <DailyChart daily={data.daily} />
              </div>
            )}

            {/* Categories */}
            {categoryData.length > 0 && (
              <div className="px-4 py-4">
                <SectionLabel>Danh mục</SectionLabel>
                <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-zinc-100">
                  {categoryData.map(cat => {
                    const w = pct(cat.revenue, Number(data.summary.revenue));
                    return w > 0 ? <div key={cat.name} className={`${CAT_COLORS[cat.name] || "bg-zinc-300"} transition-all`} style={{ width: `${w}%` }} /> : null;
                  })}
                </div>
                <div className="mt-3 space-y-2">
                  {categoryData.map(cat => (
                    <div key={cat.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CategoryIcon category={cat.name} size={14} className={`${CAT_DOT[cat.name] ? "text-zinc-500" : "text-zinc-400"}`} />
                        <span className="text-sm text-zinc-600">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-zinc-400">{cat.qty} món · {pct(cat.revenue, Number(data.summary.revenue))}%</span>
                        <span className="text-sm font-medium text-zinc-800">{fmt(cat.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Items */}
            {data.topItems.length > 0 && (
              <div className="px-4 py-4 pb-8">
                <SectionLabel>Bán chạy</SectionLabel>
                <TopItems items={data.topItems} />
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">{children}</p>;
}

function PayItem({ label, amount, count, dot }: { label: string; amount: number; count: number; dot: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <div className={`h-2 w-2 rounded-full ${dot}`} />
        <span className="text-xs text-zinc-400">{label}</span>
      </div>
      <p className="mt-0.5 text-sm font-semibold text-zinc-800">{fmt(amount)}</p>
      <p className="text-xs text-zinc-400">{count} đơn</p>
    </div>
  );
}

function HourlyChart({ hourly }: { hourly: StatsData["hourly"] }) {
  const maxRev = Math.max(...hourly.map(h => Number(h.revenue)), 1);
  const hours = Array.from({ length: 24 }, (_, i) => {
    const found = hourly.find(h => h.hour === i);
    return { hour: i, revenue: found ? Number(found.revenue) : 0, orders: found ? found.order_count : 0 };
  }).filter(h => h.hour >= 7 && h.hour <= 23);

  return (
    <div className="mt-3">
      <div className="flex items-end gap-[3px]" style={{ height: 100 }}>
        {hours.map(h => {
          const height = maxRev > 0 ? (h.revenue / maxRev) * 100 : 0;
          return (
            <div key={h.hour} className="group relative flex flex-1 flex-col items-center">
              <div
                className={`w-full rounded-sm transition-all ${h.revenue > 0 ? "bg-zinc-800 group-hover:bg-zinc-600" : "bg-zinc-100"}`}
                style={{ height: `${Math.max(height, 2)}%` }}
              />
              {h.revenue > 0 && (
                <div className="pointer-events-none absolute -top-12 z-10 hidden rounded-md bg-zinc-800 px-2 py-1 text-xs text-white shadow group-hover:block">
                  <p className="font-medium">{fmt(h.revenue)}</p>
                  <p className="text-zinc-400">{h.orders} đơn</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex gap-[3px]">
        {hours.map(h => (
          <div key={h.hour} className="flex-1 text-center text-xs text-zinc-400">
            {h.hour % 3 === 0 ? `${h.hour}` : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

function DailyChart({ daily }: { daily: StatsData["daily"] }) {
  const maxRev = Math.max(...daily.map(d => Number(d.revenue)), 1);
  return (
    <div className="mt-2 space-y-1.5">
      {daily.map(d => {
        const w = pct(Number(d.revenue), maxRev);
        return (
          <div key={d.date} className="flex items-center gap-2.5">
            <span className="w-14 shrink-0 text-xs text-zinc-400">{fmtDate(d.date)}</span>
            <div className="flex-1">
              <div className="h-5 overflow-hidden rounded bg-zinc-100">
                <div
                  className="flex h-full items-center rounded bg-zinc-800 px-2 transition-all"
                  style={{ width: `${Math.max(w, 6)}%` }}
                >
                  {w > 35 && <span className="text-xs font-medium text-white">{fmt(Number(d.revenue))}</span>}
                </div>
              </div>
            </div>
            <div className="w-18 shrink-0 text-right">
              {w <= 35 && <span className="text-xs font-medium text-zinc-700">{fmt(Number(d.revenue))}</span>}
              <p className="text-xs text-zinc-400">{d.order_count} đơn</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TopItems({ items }: { items: StatsData["topItems"] }) {
  const maxQty = Math.max(...items.map(i => i.qty), 1);
  return (
    <div className="mt-2 space-y-2">
      {items.map((item, i) => {
        const w = pct(item.qty, maxQty);
        const cat = ITEM_TO_CATEGORY.get(item.name);
        return (
          <div key={item.name} className="flex items-center gap-2">
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs font-semibold ${
              i < 3 ? "bg-zinc-800 text-white" : "bg-zinc-100 text-zinc-500"
            }`}>
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="truncate text-sm text-zinc-700">{item.name}</span>
                <span className="ml-2 shrink-0 text-xs font-medium text-zinc-800">{fmt(Number(item.revenue))}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className={`h-full rounded-full transition-all ${cat ? CAT_COLORS[cat] || "bg-zinc-400" : "bg-zinc-400"}`}
                  style={{ width: `${Math.max(w, 3)}%` }}
                />
              </div>
              <p className="mt-0.5 text-xs text-zinc-400">x{item.qty}{cat ? ` · ${cat}` : ""}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
