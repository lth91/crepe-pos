"use client";

import { useState, useEffect, useCallback } from "react";
import type { Order } from "@/lib/types";
import { fmt } from "@/lib/menu";

export function HistoryView({ onBack }: { onBack: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const fetchOrders = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders?page=${p}`);
      if (!res.ok) throw new Error("Không thể tải lịch sử đơn hàng");
      const json = await res.json();
      setOrders(json.orders);
      setTotalPages(json.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(page);
  }, [page, fetchOrders]);

  function fmtTime(d: string) {
    return new Date(d).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-amber-50">
      <div className="flex items-center gap-3 bg-amber-700 px-4 py-3 text-white">
        <button onClick={onBack} className="text-2xl active:opacity-70">
          ←
        </button>
        <h1 className="text-lg font-bold">Lịch sử đơn hàng</h1>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-300 border-t-amber-700" />
        </div>
      ) : error ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4">
          <p className="text-center text-gray-500">{error}</p>
          <button
            onClick={() => fetchOrders(page)}
            className="rounded-xl bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white active:bg-amber-700"
          >
            Thử lại
          </button>
        </div>
      ) : orders.length === 0 ? (
        <p className="py-16 text-center text-gray-400">Chưa có đơn hàng nào</p>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {orders.map((order) => (
            <div key={order.id} className="rounded-2xl bg-white shadow-sm overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                className="flex w-full items-center justify-between p-4 text-left active:bg-gray-50"
              >
                <div>
                  <p className="text-sm text-gray-500">{fmtTime(order.created_at)}</p>
                  <p className="text-sm text-gray-400">
                    {order.items.length} món ·{" "}
                    {order.method === "cash"
                      ? "Tiền mặt"
                      : order.method === "transfer"
                        ? "CK"
                        : "Thẻ"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-amber-700">{fmt(order.total)}</span>
                  <span
                    className={`text-gray-400 transition-transform ${expanded === order.id ? "rotate-180" : ""}`}
                  >
                    ▼
                  </span>
                </div>
              </button>

              {expanded === order.id && (
                <div className="border-t px-4 pb-4 pt-3 space-y-1">
                  {order.items.map((item, idx) => (
                    <div key={`${item.name}-${idx}`} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.name} x{item.qty}
                      </span>
                      <span className="font-medium">{fmt(item.price * item.qty)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4 pb-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold shadow-sm active:bg-gray-100 disabled:opacity-30"
              >
                ← Trước
              </button>
              <span className="text-sm text-gray-500">
                {page}/{totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold shadow-sm active:bg-gray-100 disabled:opacity-30"
              >
                Sau →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
