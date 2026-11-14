"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Order } from "@/lib/types";
import { ArrowLeft, Loader2, RotateCcw, Circle, CircleCheck, StickyNote } from "@/lib/icons";

const REFRESH_MS = 10_000;

function isComplete(order: Order) {
  return order.items.length > 0 && order.items.every((_, i) => order.done.includes(i));
}

export function KitchenView({ onBack }: { onBack: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  // Skip background refreshes while a tick is being saved, so it doesn't flicker back
  const pendingSaves = useRef(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/orders?view=today");
      if (!res.ok) throw new Error("Không thể tải danh sách đơn");
      const json = await res.json();
      if (pendingSaves.current === 0) {
        setOrders(json.orders.map((o: Order) => ({ ...o, done: o.done ?? [] })));
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  async function toggleItem(order: Order, index: number) {
    const nextDone = !order.done.includes(index);
    const applyDone = (done: number[]) =>
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, done } : o)));

    // Show the tick immediately, then save
    const previous = order.done;
    applyDone(nextDone ? [...previous, index] : previous.filter((i) => i !== index));
    pendingSaves.current++;

    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id, index, done: nextDone }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      applyDone(json.done);
    } catch {
      applyDone(previous);
      setError("Không lưu được, vui lòng thử lại");
    } finally {
      pendingSaves.current--;
    }
  }

  const active = orders.filter((o) => !isComplete(o));
  const completed = orders.filter(isComplete).reverse();
  const visible = showDone ? completed : active;

  function fmtTime(d: string) {
    return new Date(d).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-zinc-100 bg-white px-4 py-2.5 pt-safe">
        <button
          onClick={onBack}
          className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-400 active:bg-zinc-100"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="whitespace-nowrap text-base font-semibold text-zinc-900">Bếp</h1>
        <div className="ml-auto flex whitespace-nowrap rounded-xl bg-zinc-100 p-1 text-sm font-medium">
          <button
            onClick={() => setShowDone(false)}
            className={`rounded-lg px-3 py-2 ${!showDone ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"}`}
          >
            Đang làm ({active.length})
          </button>
          <button
            onClick={() => setShowDone(true)}
            className={`rounded-lg px-3 py-2 ${showDone ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"}`}
          >
            Xong ({completed.length})
          </button>
        </div>
      </header>

      {error && (
        <div className="mx-4 mt-3 flex items-center justify-between rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          <span>{error}</span>
          <button onClick={load} className="flex items-center gap-1 font-medium">
            <RotateCcw size={14} /> Thử lại
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 size={22} className="animate-spin text-zinc-400" />
        </div>
      ) : visible.length === 0 ? (
        <p className="flex-1 pt-20 text-center text-sm text-zinc-400">
          {showDone ? "Chưa có đơn nào xong hôm nay" : "Không có đơn nào đang chờ"}
        </p>
      ) : (
        <div className="grid gap-3 p-4 pb-safe sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((order) => {
            const doneCount = order.items.filter((_, i) => order.done.includes(i)).length;
            const complete = isComplete(order);
            return (
              <div
                key={order.id}
                className={`overflow-hidden rounded-2xl border bg-white ${
                  complete ? "border-green-200 opacity-70" : "border-zinc-200"
                }`}
              >
                <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-zinc-900">
                      #{order.order_no}
                    </span>
                    <span className="text-sm text-zinc-400">
                      {fmtTime(order.created_at)}
                      {order.staff && ` · ${order.staff}`}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      complete ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {doneCount}/{order.items.length}
                  </span>
                </div>

                <div className="divide-y divide-zinc-50">
                  {order.items.map((item, idx) => {
                    const done = order.done.includes(idx);
                    return (
                      <button
                        key={`${item.cartKey}-${idx}`}
                        onClick={() => toggleItem(order, idx)}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left active:bg-zinc-50"
                      >
                        {done ? (
                          <CircleCheck size={26} className="mt-0.5 shrink-0 text-green-600" />
                        ) : (
                          <Circle size={26} className="mt-0.5 shrink-0 text-zinc-300" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-[15px] font-medium ${
                              done ? "text-zinc-400 line-through" : "text-zinc-800"
                            }`}
                          >
                            {item.name} <span className="font-semibold">x{item.qty}</span>
                          </p>
                          {item.extras && item.extras.length > 0 && (
                            <p className={`text-sm ${done ? "text-zinc-300" : "text-zinc-500"}`}>
                              + {item.extras.map((e) => e.name).join(", ")}
                            </p>
                          )}
                          {item.note && (
                            <p
                              className={`mt-1 flex items-center gap-1 text-sm font-semibold ${
                                done ? "text-zinc-400" : "text-amber-700"
                              }`}
                            >
                              <StickyNote size={14} className="shrink-0" />
                              {item.note}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
