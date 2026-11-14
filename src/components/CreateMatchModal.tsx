'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Calendar, Plus, ArrowRight } from 'lucide-react';
import { Match, INITIAL_ROSTER } from '@/types/football';

interface CreateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (match: Match) => void;
}

export default function CreateMatchModal({ isOpen, onClose, onCreate }: CreateMatchModalProps) {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('17:00 - 18:30');
  const [venue, setVenue] = useState('Sân bóng D7 Phú Mỹ Hưng');
  const [venueMapUrl, setVenueMapUrl] = useState('https://maps.app.goo.gl/LDVujJNsrG3UYhd98');
  const [format, setFormat] = useState<'5v5' | '7v7' | '11v11'>('7v7');
  const [targetPlayers, setTargetPlayers] = useState(14);
  const [numberOfTeams, setNumberOfTeams] = useState<2 | 3 | 4>(2);
  const [notes, setNotes] = useState('Anh em mang 2 màu áo, đến trước 15p khởi động');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      setDate(dateStr);
      setTitle(`Nội chiến FC Anh Em - ${dateStr}`);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFormatChange = (newFormat: '5v5' | '7v7' | '11v11') => {
    setFormat(newFormat);
    if (newFormat === '5v5') setTargetPlayers(10);
    if (newFormat === '7v7') setTargetPlayers(14);
    if (newFormat === '11v11') setTargetPlayers(22);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tên trận đấu!');
      return;
    }

    setIsSubmitting(true);
    const matchId = `match_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    const newMatch: Match = {
      id: matchId,
      title: title.trim(),
      date,
      time: time.trim(),
      venue: venue.trim(),
      venueMapUrl: venueMapUrl.trim() || undefined,
      format,
      targetPlayers,
      numberOfTeams,
      notes: notes.trim(),
      status: 'SCHEDULED',
      players: INITIAL_ROSTER.map((p) => ({ ...p, status: 'OUT' })),
      teams: [],
      isDrawn: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Save to local storage
    if (typeof window !== 'undefined') {
      localStorage.setItem(`footdraw_match_${matchId}`, JSON.stringify(newMatch));
    }

    // Call server API
    try {
      await fetch(`/api/matches/${matchId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMatch),
      });
    } catch {
      // ignore
    }

    if (onCreate) {
      onCreate(newMatch);
    }

    onClose();
    router.push(`/match/${matchId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Tạo trận đấu mới</h3>
              <p className="text-[11px] text-zinc-400">Thiết lập thông tin và mở phòng điểm danh & sa bàn</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="block font-bold text-zinc-200 mb-1.5 uppercase tracking-wide">
              Tên trận đấu <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Nội chiến FC Anh Em - Thứ 4"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-zinc-200 mb-1.5 uppercase tracking-wide">
                Ngày thi đấu
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-200 mb-1.5 uppercase tracking-wide">
                Khung giờ
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="VD: 17:00 - 18:30"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Venue & Maps URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-zinc-200 mb-1.5 uppercase tracking-wide">
                Sân bóng / Địa điểm
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="VD: Sân bóng D7 Phú Mỹ Hưng"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-200 mb-1.5 uppercase tracking-wide">
                Link Google Maps
              </label>
              <input
                type="url"
                value={venueMapUrl}
                onChange={(e) => setVenueMapUrl(e.target.value)}
                placeholder="https://maps.app.goo.gl/..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Format & Target Players */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-zinc-200 mb-1.5 uppercase tracking-wide">
                Quy mô sân
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['5v5', '7v7', '11v11'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => handleFormatChange(fmt)}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      format === fmt
                        ? 'bg-emerald-500 text-zinc-950 border-emerald-400 font-extrabold'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-zinc-200 mb-1.5 uppercase tracking-wide">
                Quân số mục tiêu (Người)
              </label>
              <input
                type="number"
                min={2}
                max={50}
                value={targetPlayers}
                onChange={(e) => setTargetPlayers(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Number of Teams */}
          <div>
            <label className="block font-bold text-zinc-200 mb-1.5 uppercase tracking-wide">
              Chia làm mấy đội?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([2, 3, 4] as const).map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setNumberOfTeams(num)}
                  className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    numberOfTeams === num
                      ? 'bg-emerald-500 text-zinc-950 border-emerald-400 font-extrabold shadow-sm'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  {num} Đội {num === 2 ? '(Đối kháng)' : num === 3 ? '(Tam hùng)' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-zinc-200 mb-1.5 uppercase tracking-wide">
              Ghi chú cho anh em (Màu áo, giờ giấc...)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Mang 2 màu áo Cam & Xanh, đến trước 15p..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-zinc-400 hover:text-white font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <span>Tạo trận & Mở phòng</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

