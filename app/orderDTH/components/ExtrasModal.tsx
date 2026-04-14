"use client";

import { useState } from "react";
import type { MenuItem, Extra } from "@/lib/types";
import { fmt } from "@/lib/menu";

type Props = {
  item: MenuItem;
  availableExtras: Extra[];
  onConfirm: (item: MenuItem, extras?: Extra[]) => void;
  onClose: () => void;
};

export function ExtrasModal({ item, availableExtras, onConfirm, onClose }: Props) {
  const [selectedExtras, setSelectedExtras] = useState<Extra[]>([]);

  function toggleExtra(extra: Extra) {
    setSelectedExtras((prev) =>
      prev.some((e) => e.name === extra.name)
        ? prev.filter((e) => e.name !== extra.name)
        : [...prev, extra]
    );
  }

  function handleConfirm() {
    onConfirm(item, selectedExtras.length > 0 ? [...selectedExtras] : undefined);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/20 backdrop-blur-[2px] lg:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl lg:rounded-2xl">
        <div className="mb-4 flex justify-center lg:hidden">
          <div className="h-1 w-10 rounded-full bg-zinc-200" />
        </div>
        <h3 className="mb-0.5 text-lg font-semibold text-zinc-900">{item.name}</h3>
        <p className="mb-4 text-sm text-zinc-400">
          {fmt(item.price)} · Chọn thêm topping?
        </p>

        <div className="mb-4 grid grid-cols-2 gap-2 max-h-[40dvh] overflow-y-auto">
          {availableExtras.map((extra) => {
            const selected = selectedExtras.some((e) => e.name === extra.name);
            return (
              <button
                key={extra.name}
                onClick={() => toggleExtra(extra)}
                className={`flex items-center justify-between rounded-xl px-3.5 py-3.5 text-sm transition-all ${
                  selected
                    ? "bg-zinc-900 font-medium text-white"
                    : "border border-zinc-200 text-zinc-600 active:bg-zinc-50"
                }`}
              >
                <span>{extra.name}</span>
                <span className={selected ? "text-zinc-400" : "text-zinc-400"}>
                  +{fmt(extra.price)}
                </span>
              </button>
            );
          })}
        </div>

        {selectedExtras.length > 0 && (
          <div className="mb-4 rounded-xl bg-zinc-50 p-3.5 text-sm">
            <span className="text-zinc-500">Tổng: </span>
            <span className="font-semibold text-zinc-900">
              {fmt(item.price + selectedExtras.reduce((s, e) => s + e.price, 0))}
            </span>
          </div>
        )}

        <div className="flex gap-2.5 pb-safe">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-zinc-200 py-4 text-base font-medium text-zinc-600 active:bg-zinc-50"
          >
            Huỷ
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 rounded-xl bg-zinc-900 py-4 text-base font-semibold text-white active:bg-zinc-800"
          >
            {selectedExtras.length > 0 ? "Thêm với topping" : "Thêm không topping"}
          </button>
        </div>
      </div>
    </div>
  );
}
