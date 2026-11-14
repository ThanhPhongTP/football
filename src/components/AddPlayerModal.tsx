'use client';

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Star, Shield, Crosshair } from 'lucide-react';
import { Player, Position, POSITION_LABELS } from '@/types/football';

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (player: Player) => void;
  initialPlayer?: Player | null;
}

export default function AddPlayerModal({ isOpen, onClose, onAdd, initialPlayer }: AddPlayerModalProps) {
  const [name, setName] = useState(initialPlayer?.name || '');
  const [position, setPosition] = useState<Position>(initialPlayer?.position || 'MID');
  const [rating, setRating] = useState<number>(initialPlayer?.rating || 7);

  // Sync state whenever initialPlayer or isOpen changes so edit always gets the correct player
  useEffect(() => {
    if (initialPlayer) {
      setName(initialPlayer.name || '');
      setPosition(initialPlayer.position || 'MID');
      setRating(initialPlayer.rating || 7);
    } else {
      setName('');
      setPosition('MID');
      setRating(7);
    }
  }, [initialPlayer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Vui lòng nhập tên cầu thủ');
      return;
    }

    const player: Player = {
      id: initialPlayer?.id || `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      position,
      rating,
      status: initialPlayer?.status || 'OUT',
      avatar: initialPlayer?.avatar,
      matchesPlayed: initialPlayer?.matchesPlayed || 0,
      goals: initialPlayer?.goals || 0,
      assists: initialPlayer?.assists || 0,
      wins: initialPlayer?.wins || 0,
      draws: initialPlayer?.draws || 0,
      losses: initialPlayer?.losses || 0,
      mvpCount: initialPlayer?.mvpCount || 0,
    };

    onAdd(player);
    setName('');
    onClose();
  };

  const positions: { key: Position; label: string; desc: string }[] = [
    { key: 'GK', label: 'GK', desc: 'Thủ môn' },
    { key: 'DEF', label: 'DEF', desc: 'Hậu vệ / Thòng / Biên' },
    { key: 'MID', label: 'MID', desc: 'Tiền vệ / Nhạc trưởng' },
    { key: 'FWD', label: 'FWD', desc: 'Tiền đạo / Tiền đạo cắm' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg sm:max-w-xl p-6 sm:p-8 shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {initialPlayer ? 'Chỉnh sửa cầu thủ' : 'Thêm cầu thủ mới'}
              </h3>
              <p className="text-xs text-zinc-400">
                {initialPlayer ? 'Cập nhật tên, vị trí và trình độ' : 'Thêm thành viên mới vào danh sách đội bóng'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-zinc-300 mb-2 uppercase tracking-wide">
              Tên cầu thủ <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Hoàng Long, Tuấn Em..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-sm sm:text-base text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
            />
          </div>

          {/* Position */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-zinc-300 mb-2 uppercase tracking-wide">
              Vị trí sở trường
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {positions.map((pos) => {
                const isSelected = position === pos.key;
                const posMeta = POSITION_LABELS[pos.key];
                return (
                  <button
                    key={pos.key}
                    type="button"
                    onClick={() => setPosition(pos.key)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? `${posMeta.badgeClass} bg-zinc-800/90 font-semibold ring-1 ring-emerald-500/50 shadow-md`
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <span className="font-mono text-xs font-bold px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800">
                      {pos.label}
                    </span>
                    <span className="text-xs sm:text-sm truncate">{pos.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rating */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs sm:text-sm font-bold text-zinc-300 uppercase tracking-wide">
                Đánh giá trình độ (Rating)
              </label>
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-sm sm:text-base bg-amber-400/10 px-3 py-1 rounded-xl border border-amber-400/20">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{rating} / 10 điểm</span>
              </div>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="w-full accent-emerald-500 h-2.5 bg-zinc-950 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-zinc-400 mt-1.5 font-medium">
              <span>1 (Mới tập)</span>
              <span>5 (Trung bình)</span>
              <span>8 (Khá cứng)</span>
              <span>10 (Gánh team)</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-bold rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
            >
              {initialPlayer ? 'Lưu thay đổi' : 'Thêm cầu thủ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

