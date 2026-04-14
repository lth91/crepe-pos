"use client";

import type { Draft } from "@/lib/types";
import { fmt } from "@/lib/menu";
import { X, Trash2, Pencil, Clock } from "@/lib/icons";

type Props = {
  drafts: Draft[];
  onLoad: (draft: Draft) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
};

export function DraftsModal({ drafts, onLoad, onDelete, onClose }: Props) {
  function fmtTime(d: string) {
    return new Date(d).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/20 backdrop-blur-[2px] lg:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-white shadow-xl lg:rounded-2xl max-h-[85dvh] flex flex-col">
        <div className="flex justify-center pt-2.5 lg:hidden">
          <div className="h-1 w-10 rounded-full bg-zinc-200" />
        </div>

        <div className="flex items-center justify-between px-5 py-3">
          <h3 className="text-lg font-semibold text-zinc-900">Đơn nháp</h3>
          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-300 active:bg-zinc-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5 pb-safe">
          {drafts.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-300">Chưa có đơn nháp nào</p>
          ) : (
            <div className="space-y-2">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="rounded-xl border border-zinc-100 p-4"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      {draft.note && (
                        <p className="text-[15px] font-medium text-zinc-800">{draft.note}</p>
                      )}
                      <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                        <Clock size={13} />
                        <span>{fmtTime(draft.created_at)}</span>
                      </div>
                    </div>
                    <span className="text-[15px] font-semibold text-zinc-800">{fmt(draft.total)}</span>
                  </div>

                  {/* Items preview */}
                  <p className="text-sm text-zinc-500 mb-3">
                    {draft.items.map((i) => `${i.name} x${i.qty}`).join(", ")}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onLoad(draft)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white active:bg-zinc-800"
                    >
                      <Pencil size={15} />
                      Mở & sửa
                    </button>
                    <button
                      onClick={() => onDelete(draft.id)}
                      className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-200 text-zinc-400 active:bg-red-50 active:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
