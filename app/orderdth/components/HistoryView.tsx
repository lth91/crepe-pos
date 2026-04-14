"use client";

import { useState, useEffect, useCallback } from "react";
import type { Order } from "@/lib/types";
import { fmt } from "@/lib/menu";
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, RotateCcw, Loader2, Trash2 } from "@/lib/icons";

export function HistoryView({ onBack, canDelete }: { onBack: () => void; canDelete?: boolean }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  async function deleteOrder(id: number) {
    if (deleting) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/orders?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== id));
        setExpanded(null);
      }
    } catch {}
    setDeleting(null);
  }

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

  const methodLabel = (m: string) =>
    m === "cash" ? "Tiền mặt" : m === "transfer" ? "CK" : "Thẻ";

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <header className="flex items-center gap-3 border-b border-zinc-100 px-4 py-2.5 pt-safe">
        <button onClick={onBack} className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-400 active:bg-zinc-100">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-semibold text-zinc-900">Lịch sử đơn hàng</h1>
      </header>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 size={22} className="animate-spin text-zinc-400" />
        </div>
      ) : error ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4">
          <p className="text-sm text-zinc-400">{error}</p>
          <button
            onClick={() => fetchOrders(page)}
            className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white"
          >
            <RotateCcw size={14} /> Thử lại
          </button>
        </div>
      ) : orders.length === 0 ? (
        <p className="flex-1 pt-20 text-center text-sm text-zinc-300">Chưa có đơn hàng nào</p>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 pb-safe space-y-2">
          {orders.map((order) => (
            <div key={order.id} className="overflow-hidden rounded-xl border border-zinc-100">
              <button
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                className="flex w-full items-center justify-between p-4 text-left active:bg-zinc-50"
              >
                <div>
                  <p className="text-sm text-zinc-500">{fmtTime(order.created_at)}</p>
                  <p className="text-sm text-zinc-400">
                    {order.items.length} món · {methodLabel(order.method)}
                    {order.staff && <> · <span className="text-zinc-500 font-medium">{order.staff}</span></>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold text-zinc-800">{fmt(order.total)}</span>
                  <ChevronDown
                    size={16}
                    className={`text-zinc-300 transition-transform ${expanded === order.id ? "rotate-180" : ""}`}
                  />
                </div>
              </button>

              {expanded === order.id && (
                <div className="border-t border-zinc-50 bg-zinc-50/50 px-4 pb-3.5 pt-3 space-y-1.5">
                  {order.items.map((item, idx) => (
                    <div key={`${item.name}-${idx}`} className="flex justify-between text-sm">
                      <span className="text-zinc-600">
                        {item.name} <span className="text-zinc-400">x{item.qty}</span>
                      </span>
                      <span className="font-medium text-zinc-700">{fmt(item.price * item.qty)}</span>
                    </div>
                  ))}
                  {canDelete && (
                    <button
                      onClick={() => deleteOrder(order.id)}
                      disabled={deleting === order.id}
                      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 py-3 text-sm font-medium text-red-500 active:bg-red-50 disabled:opacity-50"
                    >
                      {deleting === order.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                      Xoá đơn hàng
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4 pb-4">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="flex h-11 items-center gap-1.5 rounded-xl border border-zinc-200 px-4 text-sm font-medium text-zinc-600 active:bg-zinc-50 disabled:opacity-30"
              >
                <ChevronLeft size={16} /> Trước
              </button>
              <span className="text-sm text-zinc-400">{page}/{totalPages}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="flex h-11 items-center gap-1.5 rounded-xl border border-zinc-200 px-4 text-sm font-medium text-zinc-600 active:bg-zinc-50 disabled:opacity-30"
              >
                Sau <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
