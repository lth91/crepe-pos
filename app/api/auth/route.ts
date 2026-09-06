import { cookies } from "next/headers";
import type { UserRole } from "@/lib/types";

type Account = { password: string; role: UserRole };

const VALID_ROLES: UserRole[] = ["staff", "admin"];

/**
 * Accounts are read from the POS_ACCOUNTS environment variable.
 *
 * Format: comma-separated entries of `username:password:role`
 *   POS_ACCOUNTS="nhanvien01:secret1:staff,admin:secret2:admin"
 *
 * Role must be "staff" or "admin". Usernames are case-insensitive.
 * Passwords may not contain ":" or ",".
 */
let cached: { raw: string | undefined; accounts: Record<string, Account> } | null = null;

function loadAccounts(): Record<string, Account> {
  const raw = process.env.POS_ACCOUNTS;
  if (cached && cached.raw === raw) return cached.accounts;

  const accounts = parseAccounts(raw);
  cached = { raw, accounts };
  return accounts;
}

function parseAccounts(raw: string | undefined): Record<string, Account> {
  if (!raw) return {};

  const accounts: Record<string, Account> = {};

  for (const entry of raw.split(",")) {
    const trimmed = entry.trim();
    if (!trimmed) continue;

    const parts = trimmed.split(":");
    if (parts.length !== 3) {
      console.warn(`POS_ACCOUNTS: skipping malformed entry (expected username:password:role)`);
      continue;
    }

    const [username, password, role] = parts.map((p) => p.trim());
    if (!username || !password || !VALID_ROLES.includes(role as UserRole)) {
      console.warn(`POS_ACCOUNTS: skipping invalid entry for "${username}"`);
      continue;
    }

    accounts[username.toLowerCase()] = { password, role: role as UserRole };
  }

  return accounts;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid request" }, { status: 400 });

  const { username, password } = body as { username?: string; password?: string };

  if (!username || !password) {
    return Response.json({ error: "Thiếu tài khoản hoặc mật khẩu" }, { status: 400 });
  }

  const accounts = loadAccounts();
  if (Object.keys(accounts).length === 0) {
    console.error("POS_ACCOUNTS is not configured; no one can log in");
    return Response.json(
      { error: "Hệ thống chưa cấu hình tài khoản, vui lòng liên hệ quản trị" },
      { status: 503 }
    );
  }

  const id = username.toLowerCase();
  const account = accounts[id];
  if (!account || account.password !== password) {
    return Response.json({ error: "Sai tài khoản hoặc mật khẩu" }, { status: 401 });
  }

  const session = JSON.stringify({ id, role: account.role });

  const cookieStore = await cookies();
  cookieStore.set("pos_session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 12, // 12 hours
  });

  return Response.json({ ok: true, user: { id, role: account.role } });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("pos_session");
  return Response.json({ ok: true });
}

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get("pos_session");
  if (!session) {
    return Response.json({ error: "Not logged in" }, { status: 401 });
  }

  try {
    const user = JSON.parse(session.value);
    return Response.json({ user });
  } catch {
    return Response.json({ error: "Invalid session" }, { status: 401 });
  }
}
