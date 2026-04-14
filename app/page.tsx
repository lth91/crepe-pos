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

  // Extras modal
  const [extrasModal, setExtrasModal] = useState<{
    item: MenuItem;
    availableExtras: Extra[];
  } | null>(null);

  // Payment flow
  const [showPayment, setShowPayment] = useState(false);
  const [receipt, setReceipt] = useState<{
    items: CartItem[];
    total: number;
    method: PayMethod;
    cashGiven?: number;
  } | null>(null);

  // Owner PIN
  const [pinModal, setPinModal] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // DB setup on first load
  useEffect(() => {
    fetch("/api/setup").catch(() => {});
  }, []);

  // Derived
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

  // ── Sub-views ──────────────────────────────────────────────────────
  if (view === "stats") {
    return <StatsView onBack={() => setView("pos")} />;
  }

  if (view === "history") {
    return <HistoryView onBack={() => setView("pos")} />;
  }

  if (receipt) {
    return <ReceiptView {...receipt} onNewOrder={newOrder} />;
  }

  // ── Main POS Layout ────────────────────────────────────────────────
  return (
    <div className="flex h-dvh flex-col bg-amber-50 text-gray-800 lg:flex-row">
      {/* Menu Area */}
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 bg-amber-700 px-4 py-3 text-white">
          <h1 className="text-lg font-bold tracking-wide">Crepe House</h1>
          <div className="relative ml-auto flex-1 max-w-xs">
            <input
              type="text"
              placeholder="Tìm món..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl bg-amber-600 px-4 py-2.5 text-base text-white placeholder-amber-200 outline-none focus:ring-2 focus:ring-amber-300"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-amber-200 active:text-white"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={() => setView("history")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-xl active:bg-amber-800"
            title="Lịch sử"
          >
            📋
          </button>
          <button
            onClick={() => {
              if (isOwner) {
                setView("stats");
              } else {
                setPinModal(true);
              }
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-xl active:bg-amber-800"
            title="Thống kê"
          >
            📊
          </button>
        </div>

        {/* Category Tabs */}
        {!search && (
          <div className="flex gap-2 overflow-x-auto bg-amber-100 px-3 py-2.5 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                  category === cat
                    ? "bg-amber-700 text-white shadow-sm"
                    : "bg-white/60 text-amber-800 active:bg-amber-200"
                }`}
              >
                <span>{CAT_ICONS[cat]}</span>
                <span>{cat}</span>
              </button>
            ))}
          </div>
        )}

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto p-3 pb-24 lg:pb-3">
          {search && displayedItems.length === 0 && (
            <p className="mt-12 text-center text-gray-400">Không tìm thấy món nào</p>
          )}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {displayedItems.map((item) => {
              const inCartCount = cart
                .filter((c) => c.name === item.name)
                .reduce((s, c) => s + c.qty, 0);
              return (
                <button
                  key={item.name}
                  onClick={() => handleItemTap(item)}
                  className={`relative flex flex-col items-start rounded-2xl p-4 shadow-sm transition-all active:scale-[0.97] ${
                    inCartCount > 0
                      ? "bg-amber-50 ring-2 ring-amber-400"
                      : "bg-white active:bg-gray-50"
                  }`}
                >
                  {inCartCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white shadow">
                      {inCartCount}
                    </span>
                  )}
                  <span className="text-[15px] font-medium leading-tight">{item.name}</span>
                  <span className="mt-auto pt-2 text-base font-bold text-amber-700">
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
          className="fixed bottom-5 left-4 right-4 z-30 flex items-center justify-between rounded-2xl bg-amber-700 px-5 py-4 text-white shadow-xl active:bg-amber-800 lg:hidden"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
              {itemCount}
            </span>
            <span className="text-base font-semibold">Xem đơn hàng</span>
          </div>
          <span className="text-lg font-bold">{fmt(total)}</span>
        </button>
      )}

      {/* Cart */}
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

      {/* Extras Modal */}
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

      {/* Payment Modal */}
      {showPayment && (
        <PaymentModal
          cart={cart}
          total={total}
          onClose={() => setShowPayment(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* PIN Modal */}
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
