"use client";

import { useState, useEffect, useCallback } from "react";
import type { Order } from "@/lib/types";
import { fmt, itemTotal } from "@/lib/menu";
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, RotateCcw, Loader2, Trash2 } from "@/lib/icons";

export function HistoryView({ onBack, isAdmin }: { onBack: () => void; isAdmin?: boolean }) {
  // Admins can switch to the list of deleted orders
  const [showDeleted, setShowDeleted] = useState(false);
  // First tap arms the delete button, second tap deletes
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  async function deleteOrder(id: number) {
    if (deleting) return;
    if (confirmingId !== id) {
      setConfirmingId(id);
      return;
    }
    setDeleting(id);
    try {
      const res = await fetch(`/api/orders?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== id));
        setExpanded(null);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Không xoá được đơn");
      }
    } catch {
      setError("Lỗi kết nối, vui lòng thử lại");
    }
    setDeleting(null);
    setConfirmingId(null);
  }

  const fetchOrders = useCallback(async (p: number, deleted: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders?page=${p}${deleted ? "&deleted=1" : ""}`);
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
    fetchOrders(page, showDeleted);
  }, [page, showDeleted, fetchOrders]);

  function switchTab(deleted: boolean) {
    if (deleted === showDeleted) return;
    setShowDeleted(deleted);
    setPage(1);
    setExpanded(null);
    setConfirmingId(null);
  }

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
        <h1 className="whitespace-nowrap text-base font-semibold text-zinc-900">Lịch sử</h1>
        {isAdmin && (
          <div className="ml-auto flex whitespace-nowrap rounded-xl bg-zinc-100 p-1 text-sm font-medium">
            <button
              onClick={() => switchTab(false)}
              className={`rounded-lg px-3 py-2 ${!showDeleted ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"}`}
            >
              Đơn hàng
            </button>
            <button
              onClick={() => switchTab(true)}
              className={`rounded-lg px-3 py-2 ${showDeleted ? "bg-white text-red-600 shadow-sm" : "text-zinc-500"}`}
            >
              Đã xoá
            </button>
          </div>
        )}
      </header>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 size={22} className="animate-spin text-zinc-400" />
        </div>
      ) : error ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4">
          <p className="text-sm text-zinc-400">{error}</p>
          <button
            onClick={() => fetchOrders(page, showDeleted)}
            className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white"
          >
            <RotateCcw size={14} /> Thử lại
          </button>
        </div>
      ) : orders.length === 0 ? (
        <p className="flex-1 pt-20 text-center text-sm text-zinc-300">
          {showDeleted ? "Chưa có đơn nào bị xoá" : "Chưa có đơn hàng nào"}
        </p>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 pb-safe space-y-2">
          {orders.map((order) => (
            <div key={order.id} className="overflow-hidden rounded-xl border border-zinc-100">
              <button
                onClick={() => {
                  setExpanded(expanded === order.id ? null : order.id);
                  setConfirmingId(null);
                }}
                className="flex w-full items-center justify-between p-4 text-left active:bg-zinc-50"
              >
                <div>
                  <p className="text-sm text-zinc-500">
                    {order.order_no != null && (
                      <span className="mr-1.5 font-semibold text-zinc-800">#{order.order_no}</span>
                    )}
                    {fmtTime(order.created_at)}
                  </p>
                  <p className="text-sm text-zinc-400">
                    {order.items.length} món · {methodLabel(order.method)}
                    {order.staff && <> · <span className="text-zinc-500 font-medium">{order.staff}</span></>}
                  </p>
                  {order.deleted_at && (
                    <p className="text-sm font-medium text-red-600">
                      Đã xoá bởi {order.deleted_by || "?"} · {fmtTime(order.deleted_at)}
                    </p>
                  )}
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
                    <div key={`${item.name}-${idx}`} className="text-sm">
                      <div className="flex justify-between">
                        <span className="text-zinc-600">
                          {item.name} <span className="text-zinc-400">x{item.qty}</span>
                        </span>
                        <span className="font-medium text-zinc-700">{fmt(itemTotal(item))}</span>
                      </div>
                      {item.extras && item.extras.length > 0 && (
                        <p className="text-zinc-400">+ {item.extras.map((e) => e.name).join(", ")}</p>
                      )}
                      {item.note && <p className="font-medium text-amber-700">Ghi chú: {item.note}</p>}
                    </div>
                  ))}
                  {isAdmin && !showDeleted && (
                    <button
                      onClick={() => deleteOrder(order.id)}
                      disabled={deleting === order.id}
                      className={`mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-medium disabled:opacity-50 ${
                        confirmingId === order.id
                          ? "bg-red-600 text-white active:bg-red-700"
                          : "border border-red-200 text-red-500 active:bg-red-50"
                      }`}
                    >
                      {deleting === order.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                      {confirmingId === order.id ? "Bấm lần nữa để xác nhận xoá" : "Xoá đơn hàng"}
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
