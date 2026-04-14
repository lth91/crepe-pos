"use client";

import type { CartItem } from "@/lib/types";
import { fmt, itemUnitPrice } from "@/lib/menu";

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
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setCartOpen(false)}
        />
      )}

      <div
        className={`fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-3xl bg-white shadow-2xl transition-transform duration-300 lg:static lg:z-auto lg:max-h-none lg:w-96 lg:rounded-none lg:border-l lg:shadow-none ${
          cartOpen ? "translate-y-0" : "translate-y-full lg:translate-y-0"
        }`}
      >
        <div className="flex justify-center pt-2 lg:hidden">
          <div className="h-1.5 w-12 rounded-full bg-gray-300" />
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-lg font-bold">
            Đơn hàng{" "}
            {itemCount > 0 && (
              <span className="text-sm font-normal text-gray-500">({itemCount} món)</span>
            )}
          </h2>
          <div className="flex items-center gap-3">
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-sm text-red-500 active:text-red-700">
                Xoá hết
              </button>
            )}
            <button
              onClick={() => setCartOpen(false)}
              className="text-2xl text-gray-400 lg:hidden"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-2">
          {cart.length === 0 ? (
            <p className="py-12 text-center text-gray-300">Chưa có món nào</p>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.cartKey} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-medium">{item.name}</p>
                    {item.extras && item.extras.length > 0 && (
                      <p className="truncate text-xs text-amber-600">
                        + {item.extras.map((e) => e.name).join(", ")}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">{fmt(itemUnitPrice(item))}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQty(item.cartKey, -1)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-200 text-xl font-bold active:bg-gray-300"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-base font-semibold">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.cartKey, 1)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-200 text-xl font-bold active:bg-gray-300"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.cartKey)}
                    className="p-1 text-lg text-gray-400 active:text-red-500"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t px-4 py-4">
          <div className="mb-3 flex justify-between text-xl font-bold">
            <span>Tổng</span>
            <span className="text-amber-700">{fmt(total)}</span>
          </div>
          <button
            onClick={openPayment}
            disabled={cart.length === 0}
            className="w-full rounded-2xl bg-amber-600 py-4 text-lg font-semibold text-white active:bg-amber-700 disabled:bg-gray-300 disabled:text-gray-500"
          >
            Thanh toán
          </button>
        </div>
      </div>
    </>
  );
}
