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
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 lg:items-center">
      <div className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-xl lg:rounded-2xl">
        <div className="mb-4 flex justify-center lg:hidden">
          <div className="h-1.5 w-12 rounded-full bg-gray-300" />
        </div>
        <h3 className="mb-1 text-xl font-bold">{item.name}</h3>
        <p className="mb-4 text-sm text-gray-500">
          {fmt(item.price)} · Chọn thêm topping?
        </p>

        <div className="mb-5 grid grid-cols-2 gap-2 max-h-[40dvh] overflow-y-auto">
          {availableExtras.map((extra) => {
            const selected = selectedExtras.some((e) => e.name === extra.name);
            return (
              <button
                key={extra.name}
                onClick={() => toggleExtra(extra)}
                className={`flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                  selected
                    ? "bg-amber-600 text-white"
                    : "bg-gray-100 text-gray-700 active:bg-gray-200"
                }`}
              >
                <span>{extra.name}</span>
                <span className={selected ? "text-amber-200" : "text-gray-400"}>
                  +{fmt(extra.price)}
                </span>
              </button>
            );
          })}
        </div>

        {selectedExtras.length > 0 && (
          <div className="mb-4 rounded-xl bg-amber-50 p-3 text-sm">
            <span className="text-gray-600">Tổng: </span>
            <span className="font-bold text-amber-700">
              {fmt(item.price + selectedExtras.reduce((s, e) => s + e.price, 0))}
            </span>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl bg-gray-100 py-4 text-base font-semibold text-gray-700 active:bg-gray-200"
          >
            Huỷ
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 rounded-2xl bg-amber-600 py-4 text-base font-semibold text-white active:bg-amber-700"
          >
            {selectedExtras.length > 0 ? "Thêm với topping" : "Thêm không topping"}
          </button>
        </div>
      </div>
    </div>
  );
}
