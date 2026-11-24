export type MenuItem = { name: string; price: number };
export type Extra = { name: string; price: number };
export type CartItem = MenuItem & {
  qty: number;
  extras?: Extra[];
  cartKey: string;
  /** Free text from staff, e.g. which customer or table the item is for */
  note?: string;
};
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
  /** Sales split by shift: morning 07:00–19:00, evening 19:00–07:00 */
  shifts: { shift: "morning" | "evening"; order_count: number; revenue: number }[];
  topItems: { name: string; qty: number; revenue: number }[];
  categoryBreakdown: { name: string; qty: number; revenue: number }[];
  paymentCounts: { method: string; count: number }[];
  /** Orders in the range that were deleted afterwards */
  deleted?: { order_count: number; revenue: number };
};

export type Order = {
  id: number;
  /** Daily order number; null for orders created before numbering existed */
  order_no: number | null;
  items: CartItem[];
  /** Indexes into `items` that have been ticked as made */
  done: number[];
  /** Set when an admin deleted the order */
  deleted_at?: string | null;
  deleted_by?: string | null;
  delete_reason?: string | null;
  total: number;
  method: PayMethod;
  staff: string | null;
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
