"use client";

import type { CartItem } from "@/lib/types";
import { fmt, itemUnitPrice } from "@/lib/menu";
import { X, Minus, Plus, Trash2 } from "@/lib/icons";

type Props = {
  cart: CartItem[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  total: number;
  itemCount: number;
  updateQty: (key: string, delta: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
  openPayment: () => void;
};

export function CartSheet({
  cart,
  cartOpen,
  setCartOpen,
  total,
  itemCount,
  updateQty,
  removeItem,
  clearCart,
  openPayment,
}: Props) {
  return (
    <>
      {cartOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] lg:hidden"
          onClick={() => setCartOpen(false)}
        />
      )}

      <div
        className={`fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-2xl bg-white shadow-xl transition-transform duration-300 lg:static lg:z-auto lg:max-h-none lg:w-96 lg:rounded-none lg:border-l lg:border-zinc-100 lg:shadow-none ${
          cartOpen ? "translate-y-0" : "translate-y-full lg:translate-y-0"
        }`}
      >
        <div className="flex justify-center pt-2.5 lg:hidden">
          <div className="h-1 w-10 rounded-full bg-zinc-200" />
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-base font-semibold text-zinc-900">
            Đơn hàng
            {itemCount > 0 && (
              <span className="ml-1.5 text-sm font-normal text-zinc-400">({itemCount})</span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="rounded-lg px-3 py-2 text-sm font-medium text-red-500 active:bg-red-50"
              >
                Xoá hết
              </button>
            )}
            <button
              onClick={() => setCartOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-300 active:bg-zinc-100 lg:hidden"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-2">
          {cart.length === 0 ? (
            <p className="py-16 text-center text-sm text-zinc-300">Chưa có món nào</p>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <div
                  key={item.cartKey}
                  className="flex items-center gap-3 rounded-xl border border-zinc-100 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium text-zinc-800">{item.name}</p>
                    {item.extras && item.extras.length > 0 && (
                      <p className="truncate text-sm text-amber-600">
                        + {item.extras.map((e) => e.name).join(", ")}
                      </p>
                    )}
                    <p className="text-sm text-zinc-400">{fmt(itemUnitPrice(item))}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQty(item.cartKey, -1)}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 active:bg-zinc-100"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-8 text-center text-base font-semibold">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.cartKey, 1)}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 active:bg-zinc-100"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.cartKey)}
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-300 active:text-red-500 active:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-zinc-100 px-4 py-4 pb-safe">
          <div className="mb-3 flex justify-between text-lg font-semibold">
            <span className="text-zinc-500">Tổng</span>
            <span className="text-zinc-900">{fmt(total)}</span>
          </div>
          <button
            onClick={openPayment}
            disabled={cart.length === 0}
            className="w-full rounded-xl bg-zinc-900 py-4 text-base font-semibold text-white active:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400"
          >
            Thanh toán
          </button>
        </div>
      </div>
    </>
  );
}
