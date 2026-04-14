"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import type { MenuItem, Extra, CartItem, PayMethod, Draft, UserSession } from "@/lib/types";
import {
  MENU,
  CATEGORIES,
  getExtrasForCategory,
  fmt,
  makeCartKey,
  itemTotal,
} from "@/lib/menu";
import { Search, X, ClipboardList, BarChart3, FileText, CategoryIcon } from "@/lib/icons";
import { LogOut, Loader2 } from "lucide-react";
import { StatsView } from "./components/StatsView";
import { HistoryView } from "./components/HistoryView";
import { CartSheet } from "./components/CartSheet";
import { PaymentModal } from "./components/PaymentModal";
import { ExtrasModal } from "./components/ExtrasModal";
import { ReceiptView } from "./components/ReceiptView";
import { DraftsModal } from "./components/DraftsModal";
import { LoginScreen } from "./components/LoginScreen";

const DRAFTS_KEY = "crepe-pos-drafts";

export default function POS() {
  // Auth
  const [user, setUser] = useState<UserSession | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Check session on load
  useEffect(() => {
    fetch("/api/auth")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    setUser(null);
  }

  // POS state
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

  // Drafts
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [showDrafts, setShowDrafts] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFTS_KEY);
      if (saved) setDrafts(JSON.parse(saved));
    } catch {}
  }, []);

  const saveDraftsToStorage = useCallback((next: Draft[]) => {
    setDrafts(next);
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(next));
  }, []);

  function saveDraft() {
    if (cart.length === 0) return;
    const t = cart.reduce((s, i) => s + itemTotal(i), 0);

    if (editingDraftId) {
      const next = drafts.map((d) =>
        d.id === editingDraftId
          ? { ...d, items: [...cart], total: t, created_at: new Date().toISOString() }
          : d
      );
      saveDraftsToStorage(next);
      setEditingDraftId(null);
    } else {
      const draft: Draft = {
        id: crypto.randomUUID(),
        items: [...cart],
        total: t,
        note: `Bàn ${drafts.length + 1}`,
        created_at: new Date().toISOString(),
      };
      saveDraftsToStorage([draft, ...drafts]);
    }

    setCart([]);
    setCartOpen(false);
  }

  function loadDraft(draft: Draft) {
    setCart(draft.items);
    setEditingDraftId(draft.id);
    setShowDrafts(false);
    setCartOpen(false);
  }

  function deleteDraft(id: string) {
    saveDraftsToStorage(drafts.filter((d) => d.id !== id));
    if (editingDraftId === id) setEditingDraftId(null);
  }

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
    if (editingDraftId) {
      saveDraftsToStorage(drafts.filter((d) => d.id !== editingDraftId));
      setEditingDraftId(null);
    }
  }

  function newOrder() {
    setReceipt(null);
    setCart([]);
    setSearch("");
    setCategory(CATEGORIES[0]);
    setEditingDraftId(null);
  }

  const isAdmin = user?.role === "admin";

  // ── Loading ────────────────────────────────────────────────────────
  if (!authChecked) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white">
        <Loader2 size={24} className="animate-spin text-zinc-400" />
      </div>
    );
  }

  // ── Login ──────────────────────────────────────────────────────────
  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  // ── Sub-views ──────────────────────────────────────────────────────
  if (view === "stats" && isAdmin) {
    return <StatsView onBack={() => setView("pos")} onHistory={() => setView("history")} />;
  }
  if (view === "history") {
    return <HistoryView onBack={() => setView("pos")} canDelete />;
  }
  if (receipt) {
    return <ReceiptView {...receipt} onNewOrder={newOrder} />;
  }

  // ── Main POS ───────────────────────────────────────────────────────
  return (
    <div className="flex h-dvh flex-col bg-white text-zinc-800 lg:flex-row">
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center gap-2 border-b border-zinc-100 px-4 py-2.5 pt-safe">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-zinc-900">Crepe House</h1>
            <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
              {user.id}
            </span>
          </div>
          <div className="relative ml-auto flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Tìm món..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-9 pr-9 py-2.5 text-base outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-0 top-0 flex h-full w-10 items-center justify-center text-zinc-400 active:text-zinc-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowDrafts(true)}
            className="relative flex h-11 w-11 items-center justify-center rounded-xl text-zinc-400 active:bg-zinc-100"
            title="Đơn nháp"
          >
            <FileText size={20} />
            {drafts.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[11px] font-semibold text-white">
                {drafts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setView("history")}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-400 active:bg-zinc-100"
            title="Lịch sử"
          >
            <ClipboardList size={20} />
          </button>
          {isAdmin && (
            <button
              onClick={() => setView("stats")}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-400 active:bg-zinc-100"
              title="Thống kê"
            >
              <BarChart3 size={20} />
            </button>
          )}
          <button
            onClick={handleLogout}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-300 active:bg-red-50 active:text-red-500"
            title="Đăng xuất"
          >
            <LogOut size={18} />
          </button>
        </header>

        {/* Category Sidebar + Menu Grid */}
        <div className="flex min-h-0 flex-1">
          {!search && (
            <div className="flex w-[72px] shrink-0 flex-col gap-1 overflow-y-auto border-r border-zinc-100 bg-zinc-50/50 py-2 px-1.5 scrollbar-hide">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`flex flex-col items-center gap-1 rounded-xl px-1 py-3 text-center transition-colors ${
                    category === cat
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-400 active:bg-zinc-100 active:text-zinc-600"
                  }`}
                >
                  <CategoryIcon category={cat} size={20} />
                  <span className="text-[11px] font-medium leading-tight">
                    {cat === "Sweet Crepes" ? "Sweet" : cat === "Savory Crepes" ? "Savory" : cat}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3 pb-28 lg:pb-4">
            {search && displayedItems.length === 0 && (
              <p className="mt-16 text-center text-sm text-zinc-400">Không tìm thấy món nào</p>
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
                    className={`relative flex flex-col items-start rounded-xl border p-3.5 text-left transition-all active:scale-[0.97] active:bg-zinc-50 ${
                      inCartCount > 0
                        ? "border-amber-300 bg-amber-50/50"
                        : "border-zinc-200 bg-white"
                    }`}
                  >
                    {inCartCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
                        {inCartCount}
                      </span>
                    )}
                    <span className="text-[15px] font-medium leading-snug text-zinc-800">
                      {item.name}
                    </span>
                    <span className="mt-auto pt-2 text-[15px] font-semibold text-amber-700">
                      {fmt(item.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-5 left-4 right-4 z-30 flex items-center justify-between rounded-2xl bg-zinc-900 px-5 py-4 text-white shadow-lg active:bg-zinc-800 lg:hidden pb-safe"
          style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 text-sm font-semibold">
              {itemCount}
            </span>
            <span className="text-[15px] font-medium">Xem đơn hàng</span>
          </div>
          <span className="text-[15px] font-semibold">{fmt(total)}</span>
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
        onSaveDraft={saveDraft}
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

      {showDrafts && (
        <DraftsModal
          drafts={drafts}
          onLoad={loadDraft}
          onDelete={deleteDraft}
          onClose={() => setShowDrafts(false)}
        />
      )}

      {editingDraftId && cart.length > 0 && (
        <div className="fixed top-0 left-0 right-0 z-20 flex items-center justify-center bg-amber-500 py-1.5 pt-safe text-sm font-medium text-white lg:hidden">
          Đang sửa đơn nháp · Bấm Thanh toán hoặc Lưu lại
        </div>
      )}
    </div>
  );
}
