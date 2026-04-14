"use client";

import type { CartItem, PayMethod } from "@/lib/types";
import { fmt, itemTotal } from "@/lib/menu";
import { CheckCircle2 } from "@/lib/icons";

type Props = {
  items: CartItem[];
  total: number;
  method: PayMethod;
  cashGiven?: number;
  onNewOrder: () => void;
};

export function ReceiptView({ items, total, method, cashGiven, onNewOrder }: Props) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <CheckCircle2 size={40} className="mb-2 text-green-500" />
          <h2 className="text-xl font-semibold text-zinc-900">Crepe House</h2>
          <p className="mt-0.5 text-sm text-green-600 font-medium">Thanh toán thành công</p>
        </div>

        <div className="mb-4 space-y-3">
          {items.map((item) => (
            <div key={item.cartKey}>
              <div className="flex justify-between text-[15px]">
                <span className="text-zinc-700">
                  {item.name} <span className="text-zinc-400">x{item.qty}</span>
                </span>
                <span className="font-medium text-zinc-800">{fmt(itemTotal(item))}</span>
              </div>
              {item.extras && item.extras.length > 0 && (
                <p className="text-sm text-zinc-400 ml-0.5">
                  + {item.extras.map((e) => e.name).join(", ")}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-zinc-100 pt-4 space-y-2">
          <div className="flex justify-between text-lg font-semibold text-zinc-900">
            <span>Tổng cộng</span>
            <span>{fmt(total)}</span>
          </div>
          <div className="flex justify-between text-sm text-zinc-500">
            <span>Phương thức</span>
            <span>
              {method === "cash" ? "Tiền mặt" : method === "transfer" ? "Chuyển khoản" : "Thẻ"}
            </span>
          </div>
          {method === "cash" && cashGiven != null && (
            <>
              <div className="flex justify-between text-sm text-zinc-500">
                <span>Khách đưa</span>
                <span>{fmt(cashGiven)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium text-green-600">
                <span>Tiền trả lại</span>
                <span>{fmt(cashGiven - total)}</span>
              </div>
            </>
          )}
        </div>

        <button
          onClick={onNewOrder}
          className="mt-6 w-full rounded-xl bg-zinc-900 py-4 text-base font-semibold text-white active:bg-zinc-800"
        >
          Đơn mới
        </button>
      </div>
    </div>
  );
}
