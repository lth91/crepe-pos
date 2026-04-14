export type MenuItem = { name: string; price: number };
export type Extra = { name: string; price: number };
export type CartItem = MenuItem & { qty: number; extras?: Extra[]; cartKey: string };
export type PayMethod = "cash" | "transfer" | "card";
export type StatsData = {
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
export type Order = {
  id: number;
  items: CartItem[];
  total: number;
  method: PayMethod;
  created_at: string;
};
