'use client';

import React, { useState } from 'react';
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
  const [status, setStatus] = useState<'IN' | 'OUT'>(initialPlayer?.status === 'OUT' ? 'OUT' : 'IN');

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
      status,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <UserPlus className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-white">
              {initialPlayer ? 'Chỉnh sửa cầu thủ' : 'Thêm cầu thủ mới'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Tên cầu thủ <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Hoàng Long, Tuấn Em..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Position */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Vị trí sở trường
            </label>
            <div className="grid grid-cols-2 gap-2">
              {positions.map((pos) => {
                const isSelected = position === pos.key;
                const posMeta = POSITION_LABELS[pos.key];
                return (
                  <button
                    key={pos.key}
                    type="button"
                    onClick={() => setPosition(pos.key)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? `${posMeta.badgeClass} bg-zinc-800/90 font-semibold ring-1 ring-emerald-500/50`
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                      {pos.label}
                    </span>
                    <span className="text-xs truncate">{pos.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rating */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Đánh giá trình độ (Rating)
              </label>
              <div className="flex items-center gap-1 text-amber-400 font-bold text-sm">
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
              className="w-full accent-emerald-500 h-2 bg-zinc-950 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
              <span>1 (Mới tập)</span>
              <span>5 (Trung bình)</span>
              <span>8 (Khá cứng)</span>
              <span>10 (Gánh team)</span>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Trạng thái trận này
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('IN')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  status === 'IN'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                }`}
              >
                ✅ Có mặt (IN)
              </button>
              <button
                type="button"
                onClick={() => setStatus('OUT')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  status === 'OUT'
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                }`}
              >
                ❌ Báo bận (OUT)
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
            >
              {initialPlayer ? 'Lưu thay đổi' : 'Thêm cầu thủ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

