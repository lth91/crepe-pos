export type MenuItem = { name: string; price: number };
export type Extra = { name: string; price: number };
export type CartItem = MenuItem & { qty: number; extras?: Extra[]; cartKey: string };
export type PayMethod = "cash" | "transfer" | "card";

export type StatsData = {
  summary: {
    order_count: number;
    revenue: number;
    avg_order: number;
    min_order: number;
    max_order: number;
    cash_revenue: number;
    transfer_revenue: number;
    card_revenue: number;
  };
  prevSummary: {
    order_count: number;
    revenue: number;
  };
  daily: { date: string; order_count: number; revenue: number }[];
  hourly: { hour: number; order_count: number; revenue: number }[];
  topItems: { name: string; qty: number; revenue: number }[];
  categoryBreakdown: { name: string; qty: number; revenue: number }[];
  paymentCounts: { method: string; count: number }[];
};

export type Order = {
  id: number;
  items: CartItem[];
  total: number;
  method: PayMethod;
  created_at: string;
};

export type Draft = {
  id: string;
  items: CartItem[];
  total: number;
  note: string;
  created_at: string;
};

export type UserRole = "staff" | "admin";
export type UserSession = {
  id: string;
  role: UserRole;
};
