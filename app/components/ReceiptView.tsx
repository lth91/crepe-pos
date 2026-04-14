"use client";

import type { CartItem, PayMethod } from "@/lib/types";
import { fmt, itemTotal } from "@/lib/menu";

type Props = {
  items: CartItem[];
  total: number;
  method: PayMethod;
  cashGiven?: number;
  onNewOrder: () => void;
};

export function ReceiptView({ items, total, method, cashGiven, onNewOrder }: Props) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-amber-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <h2 className="mb-1 text-center text-2xl font-bold text-amber-800">Crepe House</h2>
        <p className="mb-6 text-center text-sm text-gray-500">Thanh toán thành công!</p>

        <div className="mb-4 space-y-3">
          {items.map((item) => (
            <div key={item.cartKey}>
              <div className="flex justify-between text-base">
                <span>
                  {item.name} x{item.qty}
                </span>
                <span className="font-medium">{fmt(itemTotal(item))}</span>
              </div>
              {item.extras && item.extras.length > 0 && (
                <p className="text-xs text-amber-600 ml-1">
                  + {item.extras.map((e) => e.name).join(", ")}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between text-xl font-bold text-amber-800">
            <span>Tổng cộng</span>
            <span>{fmt(total)}</span>
          </div>
          <div className="mt-2 flex justify-between text-base text-gray-600">
            <span>Phương thức</span>
            <span>
              {method === "cash" ? "Tiền mặt" : method === "transfer" ? "Chuyển khoản" : "Thẻ"}
            </span>
          </div>
          {method === "cash" && cashGiven != null && (
            <>
              <div className="mt-1 flex justify-between text-base text-gray-600">
                <span>Khách đưa</span>
                <span>{fmt(cashGiven)}</span>
              </div>
              <div className="mt-1 flex justify-between text-base font-semibold text-green-700">
                <span>Tiền trả lại</span>
                <span>{fmt(cashGiven - total)}</span>
              </div>
            </>
          )}
        </div>

        <button
          onClick={onNewOrder}
          className="mt-8 w-full rounded-2xl bg-amber-600 py-4 text-lg font-semibold text-white active:bg-amber-700"
        >
          Đơn mới
        </button>
      </div>
    </div>
  );
}
