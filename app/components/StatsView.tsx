"use client";

import { useState, useEffect, useCallback } from "react";
import type { StatsData } from "@/lib/types";
import { fmt, fmtDate } from "@/lib/menu";

export function StatsView({ onBack }: { onBack: () => void }) {
  const [range, setRange] = useState<"today" | "week" | "month">("today");
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (r: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/stats?range=${r}`);
      if (!res.ok) {
        if (res.status === 401) {
          onBack();
          return;
        }
        throw new Error("Không thể tải dữ liệu thống kê");
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [onBack]);

  useEffect(() => {
    fetchStats(range);
  }, [range, fetchStats]);

  const rangeLabels = { today: "Hôm nay", week: "Tuần này", month: "Tháng này" };

  return (
    <div className="flex min-h-dvh flex-col bg-amber-50">
      <div className="flex items-center gap-3 bg-amber-700 px-4 py-3 text-white">
        <button onClick={onBack} className="text-2xl active:opacity-70">
          ←
        </button>
        <h1 className="text-lg font-bold">Thống kê</h1>
      </div>

      <div className="flex gap-2 bg-amber-100 px-3 py-2.5">
        {(["today", "week", "month"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
              range === r
                ? "bg-amber-700 text-white"
                : "bg-white/60 text-amber-800 active:bg-amber-200"
            }`}
          >
            {rangeLabels[r]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-300 border-t-amber-700" />
        </div>
      ) : error ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4">
          <p className="text-center text-gray-500">{error}</p>
          <button
            onClick={() => fetchStats(range)}
            className="rounded-xl bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white active:bg-amber-700"
          >
            Thử lại
          </button>
        </div>
      ) : data ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm col-span-2">
              <p className="text-sm text-gray-500">Doanh thu</p>
              <p className="text-3xl font-bold text-amber-700">
                {fmt(Number(data.summary.revenue))}
              </p>
              <p className="mt-1 text-sm text-gray-400">{data.summary.order_count} đơn</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Tiền mặt</p>
              <p className="text-lg font-bold text-green-700">
                {fmt(Number(data.summary.cash_revenue))}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Chuyển khoản</p>
              <p className="text-lg font-bold text-blue-700">
                {fmt(Number(data.summary.transfer_revenue))}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm col-span-2">
              <p className="text-sm text-gray-500">Thẻ</p>
              <p className="text-lg font-bold text-purple-700">
                {fmt(Number(data.summary.card_revenue))}
              </p>
            </div>
          </div>

          {data.topItems.length > 0 && (
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-base font-bold text-gray-800">Món bán chạy</h3>
              <div className="space-y-2">
                {data.topItems.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-3 text-sm">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate font-medium">{item.name}</span>
                    <span className="text-gray-500">x{item.qty}</span>
                    <span className="font-semibold text-amber-700">
                      {fmt(Number(item.revenue))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.daily.length > 1 && (
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-base font-bold text-gray-800">Theo ngày</h3>
              <div className="space-y-2">
                {data.daily.map((d) => (
                  <div key={d.date} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{fmtDate(d.date)}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">{d.order_count} đơn</span>
                      <span className="font-semibold text-amber-700">
                        {fmt(Number(d.revenue))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.summary.order_count === 0 && (
            <p className="py-12 text-center text-gray-400">Chưa có đơn hàng nào</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
