import { getDb } from "@/lib/db";

export async function GET() {
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

  // Add staff column if table already exists without it
  await sql`
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS staff TEXT
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at)
  `;

  return Response.json({ ok: true, message: "Table created" });
}
