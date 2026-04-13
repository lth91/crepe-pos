"use client";

import { useState, useMemo, useEffect, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────
type MenuItem = { name: string; price: number };
type Extra = { name: string; price: number };
type CartItem = MenuItem & { qty: number; extras?: Extra[]; cartKey: string };
type PayMethod = "cash" | "transfer" | "card";
type StatsData = {
  summary: {
    order_count: number;
    revenue: number;
    cash_revenue: number;
    transfer_revenue: number;
    card_revenue: number;
  };
  daily: { date: string; order_count: number; revenue: number }[];
  topItems: { name: string; qty: number; revenue: number }[];
};

// ── Menu Data ──────────────────────────────────────────────────────────
const MENU: Record<string, MenuItem[]> = {
  "Sweet Crepes": [
    { name: "Nutella", price: 50000 },
    { name: "Nutella Lover", price: 80000 },
    { name: "Nutella Chuối Xoài Dâu", price: 65000 },
    { name: "Nutella Xoài", price: 55000 },
    { name: "Nutella Chuối", price: 55000 },
    { name: "Nutella Dâu", price: 55000 },
    { name: "Nutella Phô Mai", price: 60000 },
    { name: "Sô-cô-la", price: 45000 },
    { name: "Sô-cô-la Xoài", price: 50000 },
    { name: "Sô-cô-la Dâu", price: 50000 },
    { name: "Sô-cô-la Chuối", price: 50000 },
    { name: "Sô-cô-la Phô Mai", price: 55000 },
    { name: "Xoài Mật Ong", price: 50000 },
    { name: "Dâu Mật Ong", price: 50000 },
    { name: "Chuối Mật Ong", price: 50000 },
    { name: "Caramel", price: 45000 },
    { name: "Xoài Caramel", price: 50000 },
    { name: "Dâu Caramel", price: 50000 },
    { name: "Chuối Caramel", price: 50000 },
    { name: "Crepe Kem", price: 70000 },
  ],
  "Savory Crepes": [
    { name: "Mật Ong Phô Mai", price: 55000 },
    { name: "Thịt Nguội Phô Mai", price: 60000 },
    { name: "Ba Chỉ Phô Mai", price: 60000 },
    { name: "Xúc Xích Phô Mai", price: 60000 },
    { name: "Cá Ngừ Phô Mai", price: 60000 },
  ],
  "Ice Cream": [
    { name: "Kem Vani", price: 30000 },
    { name: "Kem Bạc Hà Chip", price: 30000 },
    { name: "Kem Dâu Tây", price: 30000 },
    { name: "Kem Sô-cô-la Bí", price: 30000 },
    { name: "Kem Trà Xanh", price: 30000 },
    { name: "Kem Dừa Non", price: 30000 },
    { name: "Kem Xoài Tươi", price: 30000 },
    { name: "Kem Sữa Chua", price: 30000 },
    { name: "Kem Bánh Oreo", price: 30000 },
    { name: "Kem Chanh Leo", price: 30000 },
  ],
  Drinks: [
    { name: "Sô-cô-la Nóng", price: 45000 },
    { name: "Trà Chanh", price: 30000 },
    { name: "Trà Đào", price: 30000 },
    { name: "Trà Vải", price: 30000 },
    { name: "Trà Dâu", price: 30000 },
    { name: "Trà Đào Cam Sả", price: 40000 },
    { name: "Nước Suối", price: 10000 },
    { name: "Nước Ngọt Chai", price: 15000 },
    { name: "Nước Ngọt Lon", price: 20000 },
    { name: "Beer", price: 25000 },
  ],
  Topping: [
    { name: "Sốt Nutella", price: 5000 },
    { name: "Sốt Sô-cô-la", price: 5000 },
    { name: "Xoài", price: 5000 },
    { name: "Chuối", price: 5000 },
    { name: "Dâu", price: 5000 },
    { name: "Sốt Caramel", price: 5000 },
    { name: "Đường", price: 5000 },
    { name: "Whipping Cream", price: 10000 },
    { name: "Phô Mai", price: 10000 },
    { name: "Xúc Xích", price: 10000 },
    { name: "Thịt Nguội", price: 10000 },
    { name: "Cá Ngừ", price: 10000 },
    { name: "Ba Chỉ", price: 10000 },
  ],
};

// Extras cho crepe ngọt
const SWEET_EXTRAS: Extra[] = [
  { name: "Nutella", price: 5000 },
  { name: "Sô-cô-la", price: 5000 },
  { name: "Xoài", price: 5000 },
  { name: "Chuối", price: 5000 },
  { name: "Dâu", price: 5000 },
  { name: "Caramel", price: 5000 },
  { name: "Đường", price: 5000 },
  { name: "Whipping Cream", price: 10000 },
];

// Extras cho crepe mặn: +10k (thịt/phô mai)
const SAVORY_EXTRAS: Extra[] = [
  { name: "Phô Mai", price: 10000 },
  { name: "Xúc Xích", price: 10000 },
  { name: "Thịt Nguội", price: 10000 },
  { name: "Cá Ngừ", price: 10000 },
  { name: "Ba Chỉ", price: 10000 },
];

function getExtrasForCategory(cat: string): Extra[] | null {
  if (cat === "Sweet Crepes") return SWEET_EXTRAS;
  if (cat === "Savory Crepes") return SAVORY_EXTRAS;
  return null;
}

const CATEGORIES = Object.keys(MENU);

const CAT_ICONS: Record<string, string> = {
  "Sweet Crepes": "🍫",
  "Savory Crepes": "🧀",
  "Ice Cream": "🍦",
  Drinks: "🥤",
  Topping: "🍯",
};

const OWNER_PIN = "1234";

function fmt(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

function makeCartKey(name: string, extras?: Extra[]) {
  if (!extras || extras.length === 0) return name;
  return name + " + " + extras.map((e) => e.name).sort().join(", ");
}

function itemTotal(item: CartItem) {
  const extrasSum = item.extras?.reduce((s, e) => s + e.price, 0) || 0;
  return (item.price + extrasSum) * item.qty;
}

function itemUnitPrice(item: CartItem) {
  return item.price + (item.extras?.reduce((s, e) => s + e.price, 0) || 0);
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

// ── Stats View ─────────────────────────────────────────────────────────
function StatsView({ onBack }: { onBack: () => void }) {
  const [range, setRange] = useState<"today" | "week" | "month">("today");
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async (r: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stats?range=${r}`);
      const json = await res.json();
      setData(json);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats(range);
  }, [range, fetchStats]);

  const rangeLabels = { today: "Hôm nay", week: "Tuần này", month: "Tháng này" };

  return (
    <div className="flex min-h-dvh flex-col bg-amber-50">
      {/* Header */}
      <div className="flex items-center gap-3 bg-amber-700 px-4 py-3 text-white">
        <button onClick={onBack} className="text-2xl active:opacity-70">
          ←
        </button>
        <h1 className="text-lg font-bold">Thống kê</h1>
      </div>

      {/* Range Tabs */}
      <div className="flex gap-2 bg-amber-100 px-3 py-2.5">
        {(["today", "week", "month"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
              range === r
                ? "bg-amber-700 text-white"
                : "bg-white/60 text-amber-800 active:bg-amber-200"
            }`}
          >
            {rangeLabels[r]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-300 border-t-amber-700" />
        </div>
      ) : data ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm col-span-2">
              <p className="text-sm text-gray-500">Doanh thu</p>
              <p className="text-3xl font-bold text-amber-700">
                {fmt(Number(data.summary.revenue))}
              </p>
              <p className="mt-1 text-sm text-gray-400">{data.summary.order_count} đơn</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Tiền mặt</p>
              <p className="text-lg font-bold text-green-700">
                {fmt(Number(data.summary.cash_revenue))}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Chuyển khoản</p>
              <p className="text-lg font-bold text-blue-700">
                {fmt(Number(data.summary.transfer_revenue))}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm col-span-2">
              <p className="text-sm text-gray-500">Thẻ</p>
              <p className="text-lg font-bold text-purple-700">
                {fmt(Number(data.summary.card_revenue))}
              </p>
            </div>
          </div>

          {/* Top Items */}
          {data.topItems.length > 0 && (
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-base font-bold text-gray-800">
                Món bán chạy
              </h3>
              <div className="space-y-2">
                {data.topItems.map((item, i) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-3 text-sm"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate font-medium">
                      {item.name}
                    </span>
                    <span className="text-gray-500">x{item.qty}</span>
                    <span className="font-semibold text-amber-700">
                      {fmt(Number(item.revenue))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily Breakdown */}
          {data.daily.length > 1 && (
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-base font-bold text-gray-800">
                Theo ngày
              </h3>
              <div className="space-y-2">
                {data.daily.map((d) => (
                  <div
                    key={d.date}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-600">{fmtDate(d.date)}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">
                        {d.order_count} đơn
                      </span>
                      <span className="font-semibold text-amber-700">
                        {fmt(Number(d.revenue))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.summary.order_count === 0 && (
            <p className="py-12 text-center text-gray-400">
              Chưa có đơn hàng nào
            </p>
          )}
        </div>
      ) : (
        <p className="py-12 text-center text-gray-400">Lỗi tải dữ liệu</p>
      )}
    </div>
  );
}

// ── Order History View ─────────────────────────────────────────────────
type Order = {
  id: number;
  items: CartItem[];
  total: number;
  method: PayMethod;
  created_at: string;
};

function HistoryView({ onBack }: { onBack: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  const fetchOrders = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders?page=${p}`);
      const json = await res.json();
      setOrders(json.orders);
      setTotalPages(json.totalPages);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders(page);
  }, [page, fetchOrders]);

  function fmtTime(d: string) {
    return new Date(d).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-amber-50">
      <div className="flex items-center gap-3 bg-amber-700 px-4 py-3 text-white">
        <button onClick={onBack} className="text-2xl active:opacity-70">
          ←
        </button>
        <h1 className="text-lg font-bold">Lịch sử đơn hàng</h1>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-300 border-t-amber-700" />
        </div>
      ) : orders.length === 0 ? (
        <p className="py-16 text-center text-gray-400">Chưa có đơn hàng nào</p>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {orders.map((order) => (
            <div key={order.id} className="rounded-2xl bg-white shadow-sm overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                className="flex w-full items-center justify-between p-4 text-left active:bg-gray-50"
              >
                <div>
                  <p className="text-sm text-gray-500">{fmtTime(order.created_at)}</p>
                  <p className="text-sm text-gray-400">
                    {order.items.length} món ·{" "}
                    {order.method === "cash" ? "Tiền mặt" : order.method === "transfer" ? "CK" : "Thẻ"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-amber-700">
                    {fmt(order.total)}
                  </span>
                  <span className={`text-gray-400 transition-transform ${expanded === order.id ? "rotate-180" : ""}`}>
                    ▼
                  </span>
                </div>
              </button>

              {expanded === order.id && (
                <div className="border-t px-4 pb-4 pt-3 space-y-1">
                  {order.items.map((item, idx) => (
                    <div key={`${item.name}-${idx}`} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.name} x{item.qty}
                      </span>
                      <span className="font-medium">{fmt(item.price * item.qty)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4 pb-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold shadow-sm active:bg-gray-100 disabled:opacity-30"
              >
                ← Trước
              </button>
              <span className="text-sm text-gray-500">
                {page}/{totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold shadow-sm active:bg-gray-100 disabled:opacity-30"
              >
                Sau →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────
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
  const [selectedExtras, setSelectedExtras] = useState<Extra[]>([]);

  // Payment flow
  const [showPayment, setShowPayment] = useState(false);
  const [payMethod, setPayMethod] = useState<PayMethod | null>(null);
  const [cashGiven, setCashGiven] = useState(0);
  const [receipt, setReceipt] = useState<{
    items: CartItem[];
    total: number;
    method: PayMethod;
    cashGiven?: number;
  } | null>(null);

  // Owner PIN protection
  const [pinModal, setPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  function handlePinSubmit() {
    if (pinInput === OWNER_PIN) {
      setIsOwner(true);
      setPinModal(false);
      setPinInput("");
      setPinError(false);
      setView("stats");
    } else {
      setPinError(true);
      setPinInput("");
    }
  }

  // DB setup on first load
  useEffect(() => {
    fetch("/api/setup").catch(() => {});
  }, []);

  // Derived
  const total = cart.reduce((s, i) => s + itemTotal(i), 0);
  const itemCount = cart.reduce((s, i) => s + i.qty, 0);

  const displayedItems = useMemo(() => {
    if (!search.trim()) return MENU[category];
    const q = search.toLowerCase();
    return Object.values(MENU)
      .flat()
      .filter((i) => i.name.toLowerCase().includes(q));
  }, [category, search]);

  // Find which category an item belongs to
  function findCategory(itemName: string): string | null {
    for (const [cat, items] of Object.entries(MENU)) {
      if (items.some((i) => i.name === itemName)) return cat;
    }
    return null;
  }

  // Handle menu item tap
  function handleItemTap(item: MenuItem) {
    const cat = search ? findCategory(item.name) : category;
    const extras = cat ? getExtrasForCategory(cat) : null;
    if (extras) {
      setExtrasModal({ item, availableExtras: extras });
      setSelectedExtras([]);
    } else {
      addToCartDirect(item);
    }
  }

  // Toggle an extra in the selection
  function toggleExtra(extra: Extra) {
    setSelectedExtras((prev) =>
      prev.some((e) => e.name === extra.name)
        ? prev.filter((e) => e.name !== extra.name)
        : [...prev, extra]
    );
  }

  // Confirm extras and add to cart
  function confirmExtras() {
    if (!extrasModal) return;
    const { item } = extrasModal;
    const extras = selectedExtras.length > 0 ? [...selectedExtras] : undefined;
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
    setExtrasModal(null);
    setSelectedExtras([]);
  }

  // Add item without extras (drinks, etc.)
  function addToCartDirect(item: MenuItem) {
    const key = makeCartKey(item.name);
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.cartKey === key);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { ...item, qty: 1, cartKey: key }];
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

  function clearCart() {
    setCart([]);
  }

  // Payment
  function openPayment() {
    if (cart.length === 0) return;
    setShowPayment(true);
    setPayMethod(null);
    setCashGiven(0);
    setCartOpen(false);
  }

  async function confirmPayment() {
    if (!payMethod) return;
    if (payMethod === "cash" && cashGiven < total) return;

    // Save order to database
    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart, total, method: payMethod }),
      });
    } catch {
      /* still show receipt even if save fails */
    }

    setReceipt({
      items: [...cart],
      total,
      method: payMethod,
      cashGiven: payMethod === "cash" ? cashGiven : undefined,
    });
    setCart([]);
    setShowPayment(false);
  }

  function newOrder() {
    setReceipt(null);
    setCart([]);
    setSearch("");
    setCategory(CATEGORIES[0]);
  }

  // ── Stats View ─────────────────────────────────────────────────────
  if (view === "stats") {
    return <StatsView onBack={() => setView("pos")} />;
  }

  if (view === "history") {
    return <HistoryView onBack={() => setView("pos")} />;
  }

  // ── Receipt View ───────────────────────────────────────────────────
  if (receipt) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-amber-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
          <h2 className="mb-1 text-center text-2xl font-bold text-amber-800">
            Crepe House
          </h2>
          <p className="mb-6 text-center text-sm text-gray-500">
            Thanh toán thành công!
          </p>

          <div className="mb-4 space-y-3">
            {receipt.items.map((item) => (
              <div key={item.cartKey}>
                <div className="flex justify-between text-base">
                  <span>
                    {item.name} x{item.qty}
                  </span>
                  <span className="font-medium">
                    {fmt(itemTotal(item))}
                  </span>
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
              <span>{fmt(receipt.total)}</span>
            </div>
            <div className="mt-2 flex justify-between text-base text-gray-600">
              <span>Phương thức</span>
              <span>
                {receipt.method === "cash" ? "Tiền mặt" : receipt.method === "transfer" ? "Chuyển khoản" : "Thẻ"}
              </span>
            </div>
            {receipt.method === "cash" && receipt.cashGiven != null && (
              <>
                <div className="mt-1 flex justify-between text-base text-gray-600">
                  <span>Khách đưa</span>
                  <span>{fmt(receipt.cashGiven)}</span>
                </div>
                <div className="mt-1 flex justify-between text-base font-semibold text-green-700">
                  <span>Tiền trả lại</span>
                  <span>{fmt(receipt.cashGiven - receipt.total)}</span>
                </div>
              </>
            )}
          </div>

          <button
            onClick={newOrder}
            className="mt-8 w-full rounded-2xl bg-amber-600 py-4 text-lg font-semibold text-white active:bg-amber-700"
          >
            Đơn mới
          </button>
        </div>
      </div>
    );
  }

  // ── Cart Sheet (mobile bottom sheet) ───────────────────────────────
  const cartSheet = (
    <>
      {/* Backdrop */}
      {cartOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setCartOpen(false)}
        />
      )}

      {/* Sheet */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-3xl bg-white shadow-2xl transition-transform duration-300 lg:static lg:z-auto lg:max-h-none lg:w-96 lg:rounded-none lg:border-l lg:shadow-none ${
          cartOpen ? "translate-y-0" : "translate-y-full lg:translate-y-0"
        }`}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-2 lg:hidden">
          <div className="h-1.5 w-12 rounded-full bg-gray-300" />
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-lg font-bold">
            Đơn hàng{" "}
            {itemCount > 0 && (
              <span className="text-sm font-normal text-gray-500">
                ({itemCount} món)
              </span>
            )}
          </h2>
          <div className="flex items-center gap-3">
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-sm text-red-500 active:text-red-700"
              >
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
                <div
                  key={item.cartKey}
                  className="flex items-center gap-3 rounded-xl bg-gray-50 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-medium">
                      {item.name}
                    </p>
                    {item.extras && item.extras.length > 0 && (
                      <p className="truncate text-xs text-amber-600">
                        + {item.extras.map((e) => e.name).join(", ")}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      {fmt(itemUnitPrice(item))}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQty(item.cartKey, -1)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-200 text-xl font-bold active:bg-gray-300"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-base font-semibold">
                      {item.qty}
                    </span>
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

        {/* Total + Pay */}
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

  // ── Main POS Layout ────────────────────────────────────────────────
  return (
    <div className="flex h-dvh flex-col bg-amber-50 text-gray-800 lg:flex-row">
      {/* ── Menu Area ──────────────────────────────────────────────── */}
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
                setPinInput("");
                setPinError(false);
              }
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-xl active:bg-amber-800"
            title="Thống kê"
          >
            📊
          </button>
        </div>

        {/* Category Tabs - horizontal scroll, large touch targets */}
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
            <p className="mt-12 text-center text-gray-400">
              Không tìm thấy món nào
            </p>
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
                  <span className="text-[15px] font-medium leading-tight">
                    {item.name}
                  </span>
                  <span className="mt-auto pt-2 text-base font-bold text-amber-700">
                    {fmt(item.price)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Floating Cart Button (mobile) ──────────────────────────── */}
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

      {/* ── Cart (bottom sheet on mobile, sidebar on desktop) ──────── */}
      {cartSheet}

      {/* ── Extras Modal ──────────────────────────────────────────── */}
      {extrasModal && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 lg:items-center">
          <div className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-xl lg:rounded-2xl">
            <div className="mb-4 flex justify-center lg:hidden">
              <div className="h-1.5 w-12 rounded-full bg-gray-300" />
            </div>
            <h3 className="mb-1 text-xl font-bold">{extrasModal.item.name}</h3>
            <p className="mb-4 text-sm text-gray-500">
              {fmt(extrasModal.item.price)} · Chọn thêm topping?
            </p>

            <div className="mb-5 grid grid-cols-2 gap-2 max-h-[40dvh] overflow-y-auto">
              {extrasModal.availableExtras.map((extra) => {
                const selected = selectedExtras.some(
                  (e) => e.name === extra.name
                );
                return (
                  <button
                    key={extra.name}
                    onClick={() => toggleExtra(extra)}
                    className={`flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                      selected
                        ? "bg-amber-600 text-white"
                        : "bg-gray-100 text-gray-700 active:bg-gray-200"
                    }`}
                  >
                    <span>{extra.name}</span>
                    <span className={selected ? "text-amber-200" : "text-gray-400"}>
                      +{fmt(extra.price)}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedExtras.length > 0 && (
              <div className="mb-4 rounded-xl bg-amber-50 p-3 text-sm">
                <span className="text-gray-600">Tổng: </span>
                <span className="font-bold text-amber-700">
                  {fmt(
                    extrasModal.item.price +
                      selectedExtras.reduce((s, e) => s + e.price, 0)
                  )}
                </span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setExtrasModal(null);
                  setSelectedExtras([]);
                }}
                className="flex-1 rounded-2xl bg-gray-100 py-4 text-base font-semibold text-gray-700 active:bg-gray-200"
              >
                Huỷ
              </button>
              <button
                onClick={confirmExtras}
                className="flex-1 rounded-2xl bg-amber-600 py-4 text-base font-semibold text-white active:bg-amber-700"
              >
                {selectedExtras.length > 0 ? "Thêm với topping" : "Thêm không topping"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment Modal ──────────────────────────────────────────── */}
      {showPayment && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 lg:items-center">
          <div className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-xl lg:rounded-2xl">
            <div className="mb-4 flex justify-center lg:hidden">
              <div className="h-1.5 w-12 rounded-full bg-gray-300" />
            </div>
            <h3 className="mb-5 text-xl font-bold">
              Thanh toán {fmt(total)}
            </h3>

            {/* Method Selection */}
            <div className="mb-5 flex gap-3">
              <button
                onClick={() => {
                  setPayMethod("cash");
                  setCashGiven(0);
                }}
                className={`flex-1 rounded-2xl py-4 text-base font-semibold transition-colors ${
                  payMethod === "cash"
                    ? "bg-amber-600 text-white"
                    : "bg-gray-100 text-gray-700 active:bg-gray-200"
                }`}
              >
                Tiền mặt
              </button>
              <button
                onClick={() => setPayMethod("transfer")}
                className={`flex-1 rounded-2xl py-4 text-base font-semibold transition-colors ${
                  payMethod === "transfer"
                    ? "bg-amber-600 text-white"
                    : "bg-gray-100 text-gray-700 active:bg-gray-200"
                }`}
              >
                Chuyển khoản
              </button>
              <button
                onClick={() => setPayMethod("card")}
                className={`flex-1 rounded-2xl py-4 text-base font-semibold transition-colors ${
                  payMethod === "card"
                    ? "bg-amber-600 text-white"
                    : "bg-gray-100 text-gray-700 active:bg-gray-200"
                }`}
              >
                Thẻ
              </button>
            </div>

            {/* Cash input */}
            {payMethod === "cash" && (
              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-gray-600">
                  Khách đưa
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={cashGiven || ""}
                  onChange={(e) => setCashGiven(Number(e.target.value))}
                  className="mb-3 w-full rounded-xl border-2 px-4 py-3 text-xl font-semibold outline-none focus:border-amber-500"
                  placeholder="0"
                />
                <div className="grid grid-cols-4 gap-2">
                  {[5000, 10000, 20000, 50000, 100000, 200000, 500000].map((v) => (
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
                      {cashGiven >= total
                        ? fmt(cashGiven - total)
                        : "Chưa đủ tiền"}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowPayment(false)}
                className="flex-1 rounded-2xl bg-gray-100 py-4 text-base font-semibold text-gray-700 active:bg-gray-200"
              >
                Huỷ
              </button>
              <button
                onClick={confirmPayment}
                disabled={
                  !payMethod ||
                  (payMethod === "cash" && cashGiven < total)
                }
                className="flex-1 rounded-2xl bg-amber-600 py-4 text-base font-semibold text-white active:bg-amber-700 disabled:bg-gray-300 disabled:text-gray-500"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PIN Modal ──────────────────────────────────────────── */}
      {pinModal && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 lg:items-center">
          <div className="w-full max-w-sm rounded-t-3xl bg-white p-6 shadow-xl lg:rounded-2xl">
            <div className="mb-4 flex justify-center lg:hidden">
              <div className="h-1.5 w-12 rounded-full bg-gray-300" />
            </div>
            <h3 className="mb-1 text-xl font-bold">Nhập mã PIN</h3>
            <p className="mb-4 text-sm text-gray-500">
              Chỉ chủ cửa hàng được xem thống kê
            </p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value.replace(/\D/g, ""));
                setPinError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handlePinSubmit();
              }}
              className={`mb-4 w-full rounded-xl border-2 px-4 py-3 text-center text-2xl font-semibold tracking-widest outline-none focus:border-amber-500 ${
                pinError ? "border-red-400" : ""
              }`}
              placeholder="••••"
              autoFocus
            />
            {pinError && (
              <p className="mb-3 text-center text-sm text-red-500">
                Mã PIN không đúng
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setPinModal(false);
                  setPinInput("");
                  setPinError(false);
                }}
                className="flex-1 rounded-2xl bg-gray-100 py-4 text-base font-semibold text-gray-700 active:bg-gray-200"
              >
                Huỷ
              </button>
              <button
                onClick={handlePinSubmit}
                disabled={pinInput.length < 4}
                className="flex-1 rounded-2xl bg-amber-600 py-4 text-base font-semibold text-white active:bg-amber-700 disabled:bg-gray-300 disabled:text-gray-500"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
