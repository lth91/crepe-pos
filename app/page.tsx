"use client";

import { useState, useMemo, useEffect } from "react";
import type { MenuItem, Extra, CartItem, PayMethod } from "@/lib/types";
import {
  MENU,
  CATEGORIES,
  CAT_ICONS,
  getExtrasForCategory,
  fmt,
  makeCartKey,
  itemTotal,
} from "@/lib/menu";
import { StatsView } from "./components/StatsView";
import { HistoryView } from "./components/HistoryView";
import { CartSheet } from "./components/CartSheet";
import { PaymentModal } from "./components/PaymentModal";
import { ExtrasModal } from "./components/ExtrasModal";
import { PinModal } from "./components/PinModal";
import { ReceiptView } from "./components/ReceiptView";

export default function POS() {
  const [view, setView] = useState<"pos" | "stats" | "history">("pos");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [extrasModal, setExtrasModal] = useState<{
    item: MenuItem;
    availableExtras: Extra[];
  } | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [receipt, setReceipt] = useState<{
    items: CartItem[];
    total: number;
    method: PayMethod;
    cashGiven?: number;
  } | null>(null);
  const [pinModal, setPinModal] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    fetch("/api/setup").catch(() => {});
  }, []);

  const total = useMemo(() => cart.reduce((s, i) => s + itemTotal(i), 0), [cart]);
  const itemCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);

  const displayedItems = useMemo(() => {
    if (!search.trim()) return MENU[category];
    const q = search.toLowerCase();
    return Object.values(MENU)
      .flat()
      .filter((i) => i.name.toLowerCase().includes(q));
  }, [category, search]);

  function findCategory(itemName: string): string | null {
    for (const [cat, items] of Object.entries(MENU)) {
      if (items.some((i) => i.name === itemName)) return cat;
    }
    return null;
  }

  function handleItemTap(item: MenuItem) {
    const cat = search ? findCategory(item.name) : category;
    const extras = cat ? getExtrasForCategory(cat) : null;
    if (extras) {
      setExtrasModal({ item, availableExtras: extras });
    } else {
      addToCart(item);
    }
  }

  function addToCart(item: MenuItem, extras?: Extra[]) {
    const key = makeCartKey(item.name, extras);
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.cartKey === key);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { ...item, qty: 1, extras, cartKey: key }];
    });
  }

  function updateQty(key: string, delta: number) {
    setCart((prev) =>
      prev
        .map((c) => (c.cartKey === key ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0)
    );
  }

  function removeItem(key: string) {
    setCart((prev) => prev.filter((c) => c.cartKey !== key));
  }

  function openPayment() {
    if (cart.length === 0) return;
    setShowPayment(true);
    setCartOpen(false);
  }

  function handlePaymentSuccess(r: {
    items: CartItem[];
    total: number;
    method: PayMethod;
    cashGiven?: number;
  }) {
    setReceipt(r);
    setCart([]);
    setShowPayment(false);
  }

  function newOrder() {
    setReceipt(null);
    setCart([]);
    setSearch("");
    setCategory(CATEGORIES[0]);
  }

  if (view === "stats") {
    return (
      <StatsView onBack={() => setView("pos")} onHistory={() => setView("history")} />
    );
  }
  if (view === "history") {
    return <HistoryView onBack={() => setView("pos")} />;
  }
  if (receipt) {
    return <ReceiptView {...receipt} onNewOrder={newOrder} />;
  }

  return (
    <div className="flex h-dvh flex-col bg-white text-zinc-800 lg:flex-row">
      {/* Menu Area */}
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3">
          <h1 className="text-lg font-semibold text-zinc-900">Crepe House</h1>
          <div className="relative ml-auto flex-1 max-w-xs">
            <input
              type="text"
              placeholder="Tìm món..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={() => setView("history")}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-zinc-500 transition-colors hover:bg-zinc-100 active:bg-zinc-200"
            title="Lịch sử"
          >
            📋
          </button>
          <button
            onClick={() => {
              if (isOwner) setView("stats");
              else setPinModal(true);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-zinc-500 transition-colors hover:bg-zinc-100 active:bg-zinc-200"
            title="Thống kê"
          >
            📊
          </button>
        </header>

        {/* Category Tabs */}
        {!search && (
          <div className="flex gap-1 overflow-x-auto border-b border-zinc-100 px-4 py-2 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  category === cat
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-500 hover:bg-zinc-100 active:bg-zinc-200"
                }`}
              >
                <span className="text-sm">{CAT_ICONS[cat]}</span>
                <span>{cat}</span>
              </button>
            ))}
          </div>
        )}

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto p-4 pb-24 lg:pb-4">
          {search && displayedItems.length === 0 && (
            <p className="mt-16 text-center text-sm text-zinc-400">Không tìm thấy món nào</p>
          )}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {displayedItems.map((item) => {
              const inCartCount = cart
                .filter((c) => c.name === item.name)
                .reduce((s, c) => s + c.qty, 0);
              return (
                <button
                  key={item.name}
                  onClick={() => handleItemTap(item)}
                  className={`relative flex flex-col items-start rounded-xl border p-3.5 text-left transition-all active:scale-[0.98] ${
                    inCartCount > 0
                      ? "border-amber-300 bg-amber-50/50"
                      : "border-zinc-150 bg-white hover:border-zinc-300"
                  }`}
                >
                  {inCartCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-semibold text-white">
                      {inCartCount}
                    </span>
                  )}
                  <span className="text-sm font-medium leading-snug text-zinc-800">
                    {item.name}
                  </span>
                  <span className="mt-auto pt-2 text-sm font-semibold text-amber-700">
                    {fmt(item.price)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Cart Button (mobile) */}
      {cart.length > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-4 left-4 right-4 z-30 flex items-center justify-between rounded-xl bg-zinc-900 px-4 py-3.5 text-white shadow-lg active:bg-zinc-800 lg:hidden"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/15 text-xs font-semibold">
              {itemCount}
            </span>
            <span className="text-sm font-medium">Xem đơn hàng</span>
          </div>
          <span className="text-sm font-semibold">{fmt(total)}</span>
        </button>
      )}

      <CartSheet
        cart={cart}
        cartOpen={cartOpen}
        setCartOpen={setCartOpen}
        total={total}
        itemCount={itemCount}
        updateQty={updateQty}
        removeItem={removeItem}
        clearCart={() => setCart([])}
        openPayment={openPayment}
      />

      {extrasModal && (
        <ExtrasModal
          item={extrasModal.item}
          availableExtras={extrasModal.availableExtras}
          onConfirm={(item, extras) => {
            addToCart(item, extras);
            setExtrasModal(null);
          }}
          onClose={() => setExtrasModal(null)}
        />
      )}

      {showPayment && (
        <PaymentModal
          cart={cart}
          total={total}
          onClose={() => setShowPayment(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {pinModal && (
        <PinModal
          onSuccess={() => {
            setIsOwner(true);
            setPinModal(false);
            setView("stats");
          }}
          onClose={() => setPinModal(false)}
        />
      )}
    </div>
  );
}
