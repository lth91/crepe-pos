"use client";

import { useState } from "react";
import type { CartItem, PayMethod } from "@/lib/types";
import { fmt, CASH_DENOMINATIONS } from "@/lib/menu";

type Props = {
  cart: CartItem[];
  total: number;
  onClose: () => void;
  onSuccess: (receipt: {
    items: CartItem[];
    total: number;
    method: PayMethod;
    cashGiven?: number;
  }) => void;
};

export function PaymentModal({ cart, total, onClose, onSuccess }: Props) {
  const [payMethod, setPayMethod] = useState<PayMethod | null>(null);
  const [cashGiven, setCashGiven] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmPayment() {
    if (!payMethod || saving) return;
    if (payMethod === "cash" && cashGiven < total) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({
            name: i.name,
            price: i.price,
            qty: i.qty,
            extras: i.extras,
            cartKey: i.cartKey,
          })),
          total,
          method: payMethod,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Không thể lưu đơn hàng");
      }

      onSuccess({
        items: [...cart],
        total,
        method: payMethod,
        cashGiven: payMethod === "cash" ? cashGiven : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi lưu đơn hàng");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/20 backdrop-blur-[2px] lg:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl lg:rounded-2xl">
        <div className="mb-4 flex justify-center lg:hidden">
          <div className="h-1 w-10 rounded-full bg-zinc-200" />
        </div>

        <h3 className="mb-5 text-lg font-semibold text-zinc-900">
          Thanh toán <span className="text-amber-700">{fmt(total)}</span>
        </h3>

        {/* Method Selection */}
        <div className="mb-5 flex gap-2">
          {(
            [
              ["cash", "Tiền mặt"],
              ["transfer", "Chuyển khoản"],
              ["card", "Thẻ"],
            ] as const
          ).map(([method, label]) => (
            <button
              key={method}
              onClick={() => {
                setPayMethod(method);
                if (method === "cash") setCashGiven(0);
                setError(null);
              }}
              className={`flex-1 rounded-lg py-3 text-sm font-medium transition-all ${
                payMethod === method
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-200 text-zinc-600 hover:border-zinc-300 active:bg-zinc-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Cash input */}
        {payMethod === "cash" && (
          <div className="mb-5">
            <label className="mb-1.5 block text-xs font-medium text-zinc-500">Khách đưa</label>
            <input
              type="number"
              inputMode="numeric"
              value={cashGiven || ""}
              onChange={(e) => setCashGiven(Number(e.target.value))}
              className="mb-2.5 w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-lg font-semibold outline-none focus:border-zinc-400"
              placeholder="0"
            />
            <div className="grid grid-cols-4 gap-1.5">
              {CASH_DENOMINATIONS.map((v) => (
                <button
                  key={v}
                  onClick={() => setCashGiven((prev) => prev + v)}
                  className="rounded-lg border border-zinc-200 py-2.5 text-xs font-medium text-zinc-600 active:bg-zinc-50"
                >
                  {fmt(v)}
                </button>
              ))}
            </div>
            {cashGiven > 0 && (
              <div className="mt-3 rounded-lg bg-zinc-50 p-3 text-center">
                <span className="text-xs text-zinc-500">Trả lại: </span>
                <span
                  className={`text-xl font-semibold ${
                    cashGiven >= total ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {cashGiven >= total ? fmt(cashGiven - total) : "Chưa đủ"}
                </span>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-xl border border-zinc-200 py-3.5 text-sm font-medium text-zinc-600 active:bg-zinc-50 disabled:opacity-50"
          >
            Huỷ
          </button>
          <button
            onClick={confirmPayment}
            disabled={!payMethod || (payMethod === "cash" && cashGiven < total) || saving}
            className="flex-1 rounded-xl bg-zinc-900 py-3.5 text-sm font-semibold text-white active:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400"
          >
            {saving ? "Đang xử lý..." : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
}
