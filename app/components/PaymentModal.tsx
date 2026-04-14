"use client";

import { useState } from "react";
import type { CartItem, PayMethod } from "@/lib/types";
import { fmt, itemTotal, CASH_DENOMINATIONS } from "@/lib/menu";

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
    if (!payMethod) return;
    if (payMethod === "cash" && cashGiven < total) return;
    if (saving) return;

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
      setError(err instanceof Error ? err.message : "Lỗi lưu đơn hàng, vui lòng thử lại");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 lg:items-center">
      <div className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-xl lg:rounded-2xl">
        <div className="mb-4 flex justify-center lg:hidden">
          <div className="h-1.5 w-12 rounded-full bg-gray-300" />
        </div>
        <h3 className="mb-5 text-xl font-bold">Thanh toán {fmt(total)}</h3>

        <div className="mb-5 flex gap-3">
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
              className={`flex-1 rounded-2xl py-4 text-base font-semibold transition-colors ${
                payMethod === method
                  ? "bg-amber-600 text-white"
                  : "bg-gray-100 text-gray-700 active:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {payMethod === "cash" && (
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-gray-600">Khách đưa</label>
            <input
              type="number"
              inputMode="numeric"
              value={cashGiven || ""}
              onChange={(e) => setCashGiven(Number(e.target.value))}
              className="mb-3 w-full rounded-xl border-2 px-4 py-3 text-xl font-semibold outline-none focus:border-amber-500"
              placeholder="0"
            />
            <div className="grid grid-cols-4 gap-2">
              {CASH_DENOMINATIONS.map((v) => (
                <button
                  key={v}
                  onClick={() => setCashGiven((prev) => prev + v)}
                  className="rounded-xl bg-amber-100 py-3 text-sm font-semibold text-amber-800 active:bg-amber-200"
                >
                  {fmt(v)}
                </button>
              ))}
            </div>
            {cashGiven > 0 && (
              <div className="mt-4 rounded-xl bg-green-50 p-4 text-center">
                <span className="text-sm text-gray-600">Trả lại: </span>
                <span
                  className={`text-2xl font-bold ${
                    cashGiven >= total ? "text-green-700" : "text-red-600"
                  }`}
                >
                  {cashGiven >= total ? fmt(cashGiven - total) : "Chưa đủ tiền"}
                </span>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-2xl bg-gray-100 py-4 text-base font-semibold text-gray-700 active:bg-gray-200 disabled:opacity-50"
          >
            Huỷ
          </button>
          <button
            onClick={confirmPayment}
            disabled={!payMethod || (payMethod === "cash" && cashGiven < total) || saving}
            className="flex-1 rounded-2xl bg-amber-600 py-4 text-base font-semibold text-white active:bg-amber-700 disabled:bg-gray-300 disabled:text-gray-500"
          >
            {saving ? "Đang xử lý..." : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
}
