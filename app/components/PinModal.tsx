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
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 lg:items-center">
      <div className="w-full max-w-sm rounded-t-3xl bg-white p-6 shadow-xl lg:rounded-2xl">
        <div className="mb-4 flex justify-center lg:hidden">
          <div className="h-1.5 w-12 rounded-full bg-gray-300" />
        </div>
        <h3 className="mb-1 text-xl font-bold">Nhập mã PIN</h3>
        <p className="mb-4 text-sm text-gray-500">Chỉ chủ cửa hàng được xem thống kê</p>
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
          className={`mb-4 w-full rounded-xl border-2 px-4 py-3 text-center text-2xl font-semibold tracking-widest outline-none focus:border-amber-500 ${
            pinError ? "border-red-400" : ""
          }`}
          placeholder="••••"
          autoFocus
        />
        {pinError && (
          <p className="mb-3 text-center text-sm text-red-500">Mã PIN không đúng</p>
        )}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-2xl bg-gray-100 py-4 text-base font-semibold text-gray-700 active:bg-gray-200 disabled:opacity-50"
          >
            Huỷ
          </button>
          <button
            onClick={handleSubmit}
            disabled={pinInput.length < 4 || loading}
            className="flex-1 rounded-2xl bg-amber-600 py-4 text-base font-semibold text-white active:bg-amber-700 disabled:bg-gray-300 disabled:text-gray-500"
          >
            {loading ? "Đang xác thực..." : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
}
