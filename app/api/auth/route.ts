import { cookies } from "next/headers";
import type { UserRole } from "@/lib/types";

type Account = { password: string; role: UserRole };

const ACCOUNTS: Record<string, Account> = {
  nhanvien01: { password: "nv01dth", role: "staff" },
  nhanvien02: { password: "nv02dth", role: "staff" },
  nhanvien03: { password: "nv03dth", role: "staff" },
  nhanvien04: { password: "nv04dth", role: "staff" },
  admin: { password: "admindth11", role: "admin" },
};

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid request" }, { status: 400 });

  const { username, password } = body as { username?: string; password?: string };

  if (!username || !password) {
    return Response.json({ error: "Thiếu tài khoản hoặc mật khẩu" }, { status: 400 });
  }

  const account = ACCOUNTS[username.toLowerCase()];
  if (!account || account.password !== password) {
    return Response.json({ error: "Sai tài khoản hoặc mật khẩu" }, { status: 401 });
  }

  const session = JSON.stringify({ id: username.toLowerCase(), role: account.role });

  const cookieStore = await cookies();
  cookieStore.set("pos_session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 12, // 12 hours
  });

  return Response.json({ ok: true, user: { id: username.toLowerCase(), role: account.role } });
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
