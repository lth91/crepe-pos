import { cookies } from "next/headers";
import { parseAccounts, type Account } from "@/lib/accounts";

let cached: { raw: string | undefined; accounts: Record<string, Account> } | null = null;

/** Accounts come from the POS_ACCOUNTS env var; see lib/accounts.ts for the format. */
function loadAccounts(): Record<string, Account> {
  const raw = process.env.POS_ACCOUNTS;
  if (cached && cached.raw === raw) return cached.accounts;

  const accounts = parseAccounts(raw);
  cached = { raw, accounts };
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
