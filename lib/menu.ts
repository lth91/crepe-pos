import type { MenuItem, Extra } from "./types";

export const MENU: Record<string, MenuItem[]> = {
  "Sweet Crepes": [
    { name: "Plain Crepe", price: 40000 },
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
    { name: "Sốt Nutella", price: 10000 },
    { name: "Sốt Sô-cô-la", price: 5000 },
    { name: "Xoài", price: 5000 },
    { name: "Chuối", price: 5000 },
    { name: "Dâu", price: 5000 },
    { name: "Sốt Caramel", price: 5000 },
    { name: "Vụn Oreo", price: 5000 },
    { name: "Whipping Cream", price: 10000 },
    { name: "Phô Mai", price: 10000 },
    { name: "Xúc Xích", price: 10000 },
    { name: "Thịt Nguội", price: 10000 },
    { name: "Cá Ngừ", price: 10000 },
    { name: "Ba Chỉ", price: 10000 },
  ],
};

export const SWEET_EXTRAS: Extra[] = [
  { name: "Nutella", price: 10000 },
  { name: "Sô-cô-la", price: 5000 },
  { name: "Xoài", price: 5000 },
  { name: "Chuối", price: 5000 },
  { name: "Dâu", price: 5000 },
  { name: "Caramel", price: 5000 },
  { name: "Vụn Oreo", price: 5000 },
  { name: "Whipping Cream", price: 10000 },
];

export const SAVORY_EXTRAS: Extra[] = [
  { name: "Phô Mai", price: 10000 },
  { name: "Xúc Xích", price: 10000 },
  { name: "Thịt Nguội", price: 10000 },
  { name: "Cá Ngừ", price: 10000 },
  { name: "Ba Chỉ", price: 10000 },
];

export const CATEGORIES = Object.keys(MENU);

export const CAT_ICONS: Record<string, string> = {
  "Sweet Crepes": "\uD83C\uDF6B",
  "Savory Crepes": "\uD83E\uDDC0",
  "Ice Cream": "\uD83C\uDF66",
  Drinks: "\uD83E\uDD64",
  Topping: "\uD83C\uDF6F",
};

export const CASH_DENOMINATIONS = [5000, 10000, 20000, 50000, 100000, 200000, 500000];

export function getExtrasForCategory(cat: string): Extra[] | null {
  if (cat === "Sweet Crepes") return SWEET_EXTRAS;
  if (cat === "Savory Crepes") return SAVORY_EXTRAS;
  return null;
}

export function fmt(n: number) {
  return n.toLocaleString("vi-VN") + "\u0111";
}

export function makeCartKey(name: string, extras?: Extra[]) {
  if (!extras || extras.length === 0) return name;
  return name + " + " + extras.map((e) => e.name).sort().join(", ");
}

export function itemTotal(item: { price: number; qty: number; extras?: Extra[] }) {
  const extrasSum = item.extras?.reduce((s, e) => s + e.price, 0) || 0;
  return (item.price + extrasSum) * item.qty;
}

export function itemUnitPrice(item: { price: number; extras?: Extra[] }) {
  return item.price + (item.extras?.reduce((s, e) => s + e.price, 0) || 0);
}

export function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

// Build a lookup map for server-side price validation
const ALL_ITEMS = new Map<string, number>();
for (const items of Object.values(MENU)) {
  for (const item of items) {
    ALL_ITEMS.set(item.name, item.price);
  }
}

const ALL_EXTRAS = new Map<string, number>();
for (const extra of [...SWEET_EXTRAS, ...SAVORY_EXTRAS]) {
  ALL_EXTRAS.set(extra.name, extra.price);
}

export function validateOrderTotal(
  items: { name: string; price: number; qty: number; extras?: { name: string; price: number }[] }[]
): { valid: boolean; calculated: number } {
  let calculated = 0;
  for (const item of items) {
    const menuPrice = ALL_ITEMS.get(item.name);
    if (menuPrice === undefined) return { valid: false, calculated: 0 };
    if (item.price !== menuPrice) return { valid: false, calculated: 0 };
    if (!Number.isInteger(item.qty) || item.qty < 1) return { valid: false, calculated: 0 };

    let extrasSum = 0;
    if (item.extras) {
      for (const extra of item.extras) {
        const extraPrice = ALL_EXTRAS.get(extra.name);
        if (extraPrice === undefined) return { valid: false, calculated: 0 };
        if (extra.price !== extraPrice) return { valid: false, calculated: 0 };
        extrasSum += extraPrice;
      }
    }
    calculated += (menuPrice + extrasSum) * item.qty;
  }
  return { valid: true, calculated };
}
