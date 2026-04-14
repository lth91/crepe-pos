"use client";

import { useState } from "react";

type Props = {
  onSuccess: () => void;
  onClose: () => void;
};

export function PinModal({ onSuccess, onClose }: Props) {
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (pinInput.length < 4 || loading) return;

    setLoading(true);
    setPinError(false);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinInput }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        setPinError(true);
        setPinInput("");
      }
    } catch {
      setPinError(true);
      setPinInput("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/20 backdrop-blur-[2px] lg:items-center">
      <div className="w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-xl lg:rounded-2xl">
        <div className="mb-4 flex justify-center lg:hidden">
          <div className="h-1 w-10 rounded-full bg-zinc-200" />
        </div>
        <h3 className="mb-0.5 text-lg font-semibold text-zinc-900">Nhập mã PIN</h3>
        <p className="mb-4 text-sm text-zinc-400">Chỉ chủ cửa hàng được xem thống kê</p>
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pinInput}
          onChange={(e) => {
            setPinInput(e.target.value.replace(/\D/g, ""));
            setPinError(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          className={`mb-4 w-full rounded-lg border px-4 py-3 text-center text-2xl font-semibold tracking-[0.3em] outline-none transition-colors focus:border-zinc-400 ${
            pinError ? "border-red-300 bg-red-50" : "border-zinc-200"
          }`}
          placeholder="••••"
          autoFocus
        />
        {pinError && (
          <p className="mb-3 text-center text-sm text-red-500">Mã PIN không đúng</p>
        )}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-zinc-200 py-3.5 text-sm font-medium text-zinc-600 active:bg-zinc-50 disabled:opacity-50"
          >
            Huỷ
          </button>
          <button
            onClick={handleSubmit}
            disabled={pinInput.length < 4 || loading}
            className="flex-1 rounded-xl bg-zinc-900 py-3.5 text-sm font-semibold text-white active:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400"
          >
            {loading ? "Đang xác thực..." : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
}
