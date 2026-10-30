'use client';

import React, { useState } from 'react';
import { X, ClipboardList, Check, AlertCircle } from 'lucide-react';
import { parseQuickPlayerList } from '@/lib/balance';
import { Player, POSITION_LABELS } from '@/types/football';

interface QuickPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (players: Player[]) => void;
}

export default function QuickPasteModal({ isOpen, onClose, onImport }: QuickPasteModalProps) {
  const [rawText, setRawText] = useState(`1. Hoàng Long (GK) - 8đ
2. Minh Tuấn - DEF - 7đ
3. Văn Đức - DEF
4. Quang Hải - MID - 9đ
5. Hùng Dũng - MID - 8đ
6. Tiến Linh - FWD - 8đ
7. Tuấn Hải - FWD - 8đ
8. Văn Lâm - GK - 9đ
9. Quế Ngọc Hải - DEF - 8đ
10. Thành Chung - DEF - 7đ
11. Hoàng Đức - MID - 9đ
12. Công Phượng - FWD - 8đ`);

  if (!isOpen) return null;

  const parsed = parseQuickPlayerList(rawText);

  const handleConfirm = () => {
    if (parsed.length === 0) {
      alert('Không tìm thấy tên cầu thủ nào trong văn bản dán vào!');
      return;
    }

    const newPlayers: Player[] = parsed.map((p, idx) => ({
      ...p,
      id: `p_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
    }));

    onImport(newPlayers);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Dán danh sách từ Zalo / Telegram</h3>
              <p className="text-xs text-zinc-400">Tự động nhận diện số thứ tự, vị trí (GK, DEF, MID, FWD) và điểm đánh giá</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Dán danh sách tin nhắn vào đây:
            </label>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={6}
              placeholder="1. Nguyễn Văn A (GK)&#10;2. Trần Văn B - DEF&#10;3. Lê Văn C (Tiền đạo - 8đ)..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 font-mono text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Live Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <span>Xem trước kết quả nhận diện</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold">
                  {parsed.length} cầu thủ
                </span>
              </span>
              <span className="text-[11px] text-zinc-500">Mặc định: Trạng thái &quot;Tham gia&quot;</span>
            </div>

            <div className="max-h-48 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950/60 p-2 space-y-1.5">
              {parsed.length === 0 ? (
                <div className="p-4 text-center text-zinc-500 text-xs flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Chưa có dữ liệu hợp lệ</span>
                </div>
              ) : (
                parsed.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800/80 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 font-mono w-5">{idx + 1}.</span>
                      <span className="font-medium text-zinc-200">{p.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                          POSITION_LABELS[p.position].badgeClass
                        }`}
                      >
                        {p.position}
                      </span>
                      <span className="text-[11px] text-amber-400 font-medium">★ {p.rating}/10</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800 bg-zinc-950/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={parsed.length === 0}
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Thêm {parsed.length} cầu thủ vào danh sách</span>
          </button>
        </div>
      </div>
    </div>
  );
}

