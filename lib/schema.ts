import { getDb } from "./db";

let ready: Promise<void> | null = null;

/**
 * Create the orders table and add any missing columns. Runs once per server
 * instance, so new columns appear in production without a manual migration.
 */
export function ensureSchema(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      const sql = getDb();
      await sql`
        CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          items JSONB NOT NULL,
          total INTEGER NOT NULL,
          method TEXT NOT NULL,
          staff TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS staff TEXT`;
      // Order number, restarting at 1 each working day (07:00 Vietnam time)
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_no INTEGER`;
      // Indexes into `items` that the kitchen has ticked as made
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS done JSONB NOT NULL DEFAULT '[]'::jsonb`;
      // Soft delete: deleted orders are kept for review but excluded from sales
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_by TEXT`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delete_reason TEXT`;
      await sql`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at)`;
    })().catch((err) => {
      ready = null;
      throw err;
    });
  }
  return ready;
}
