"use client";

import { useRef, useState } from "react";
import type { MenuItem, Extra } from "@/lib/types";
import { fmt, NOTE_MAX_LENGTH, ICE_CREAM_EXTRAS } from "@/lib/menu";
import { Check, ChevronDown, IceCreamCone } from "@/lib/icons";

type Props = {
  item: MenuItem;
  availableExtras: Extra[];
  onConfirm: (item: MenuItem, extras?: Extra[], note?: string) => void;
  onClose: () => void;
};

const ICE_CREAM_NAMES = new Set(ICE_CREAM_EXTRAS.map((e) => e.name));

/** "Kem Dâu Tây" -> "Dâu Tây" inside the ice cream group */
function flavourName(name: string) {
  return name.replace(/^Kem\s+/, "");
}

export function ExtrasModal({ item, availableExtras, onConfirm, onClose }: Props) {
  const [selectedExtras, setSelectedExtras] = useState<Extra[]>([]);
  const [note, setNote] = useState("");
  const [iceOpen, setIceOpen] = useState(false);
  const iceGroupRef = useRef<HTMLDivElement>(null);

  const regularExtras = availableExtras.filter((e) => !ICE_CREAM_NAMES.has(e.name));
  const iceExtras = availableExtras.filter((e) => ICE_CREAM_NAMES.has(e.name));
  const selectedIce = selectedExtras.filter((e) => ICE_CREAM_NAMES.has(e.name));
  const icePrices = new Set(iceExtras.map((e) => e.price));
  const icePriceLabel =
    icePrices.size === 1 ? `+${fmt(iceExtras[0].price)}/viên` : "giá theo vị";

  const isSelected = (extra: Extra) => selectedExtras.some((e) => e.name === extra.name);

  function toggleExtra(extra: Extra) {
    setSelectedExtras((prev) =>
      prev.some((e) => e.name === extra.name)
        ? prev.filter((e) => e.name !== extra.name)
        : [...prev, extra]
    );
  }

  function toggleIceGroup() {
    const opening = !iceOpen;
    setIceOpen(opening);
    if (opening) {
      // Bring the flavour list into view inside the scrollable topping area
      requestAnimationFrame(() =>
        iceGroupRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
      );
    }
  }

  function handleConfirm() {
    onConfirm(item, selectedExtras.length > 0 ? [...selectedExtras] : undefined, note);
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

        <div className="-mx-1 mb-4 max-h-[48dvh] space-y-2 overflow-y-auto px-1 pb-1">
          <div className="grid grid-cols-2 gap-2">
            {regularExtras.map((extra) => {
              const selected = isSelected(extra);
              return (
                <button
                  key={extra.name}
                  onClick={() => toggleExtra(extra)}
                  className={`flex items-center justify-between gap-2 rounded-xl px-3.5 py-3.5 text-left text-sm transition-colors ${
                    selected
                      ? "bg-zinc-900 font-medium text-white"
                      : "border border-zinc-200 text-zinc-600 active:bg-zinc-50"
                  }`}
                >
                  <span className="leading-tight">{extra.name}</span>
                  <span className="shrink-0 text-zinc-400">+{fmt(extra.price)}</span>
                </button>
              );
            })}
          </div>

          {iceExtras.length > 0 && (
            <div
              ref={iceGroupRef}
              className={`overflow-hidden rounded-xl border transition-colors ${
                selectedIce.length > 0 ? "border-zinc-900" : "border-zinc-200"
              }`}
            >
              <button
                onClick={toggleIceGroup}
                aria-expanded={iceOpen}
                className="flex w-full items-center gap-3 px-3.5 py-3 text-left active:bg-zinc-50"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    selectedIce.length > 0 ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  <IceCreamCone size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-zinc-800">Thêm kem</span>
                  <span className="block truncate text-xs text-zinc-400">
                    {selectedIce.length > 0
                      ? selectedIce.map((e) => flavourName(e.name)).join(", ")
                      : `${iceExtras.length} vị · ${icePriceLabel}`}
                  </span>
                </span>
                {selectedIce.length > 0 && (
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-zinc-900 px-1.5 text-xs font-semibold text-white">
                    {selectedIce.length}
                  </span>
                )}
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-zinc-400 transition-transform duration-200 ${
                    iceOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {iceOpen && (
                <div className="grid grid-cols-2 gap-1.5 border-t border-zinc-100 bg-zinc-50 p-2">
                  {iceExtras.map((extra) => {
                    const selected = isSelected(extra);
                    return (
                      <button
                        key={extra.name}
                        onClick={() => toggleExtra(extra)}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                          selected
                            ? "bg-zinc-900 font-medium text-white"
                            : "bg-white text-zinc-700 ring-1 ring-zinc-200 active:bg-zinc-100"
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                            selected ? "bg-white text-zinc-900" : "ring-1 ring-zinc-300"
                          }`}
                        >
                          {selected && <Check size={11} strokeWidth={3} />}
                        </span>
                        <span className="leading-tight">{flavourName(extra.name)}</span>
                        {icePrices.size > 1 && (
                          <span className="ml-auto shrink-0 text-xs text-zinc-400">
                            +{fmt(extra.price)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {selectedExtras.length > 0 && (
          <div className="mb-4 rounded-xl bg-zinc-50 p-3.5 text-sm">
            <span className="text-zinc-500">Tổng: </span>
            <span className="font-semibold text-zinc-900">
              {fmt(item.price + selectedExtras.reduce((s, e) => s + e.price, 0))}
            </span>
          </div>
        )}

        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={NOTE_MAX_LENGTH}
          placeholder="Ghi chú: khách nào, bàn mấy..."
          className="mb-4 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-3 text-base text-zinc-700 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white"
        />

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
