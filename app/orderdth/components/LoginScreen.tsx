"use client";

import { useState } from "react";
import type { UserSession } from "@/lib/types";
import { Lock, Loader2 } from "@/lib/icons";

type Props = {
  onLogin: (user: UserSession) => void;
};

export function LoginScreen({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Đăng nhập thất bại");
        return;
      }

      onLogin(data.user);
    } catch {
      setError("Lỗi kết nối, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-white p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900">
            <Lock size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold text-zinc-900">Crepe House POS</h1>
          <p className="mt-1 text-sm text-zinc-400">Đăng nhập để bắt đầu</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-500">Tài khoản</label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(null); }}
              className="w-full rounded-xl border border-zinc-200 px-4 py-3.5 text-base outline-none focus:border-zinc-400"
              placeholder="Nhập tài khoản"
              autoFocus
              autoComplete="username"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-500">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              className="w-full rounded-xl border border-zinc-200 px-4 py-3.5 text-base outline-none focus:border-zinc-400"
              placeholder="Nhập mật khẩu"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-center text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!username.trim() || !password.trim() || loading}
            className="w-full rounded-xl bg-zinc-900 py-4 text-base font-semibold text-white active:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Đang đăng nhập...
              </span>
            ) : (
              "Đăng nhập"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
