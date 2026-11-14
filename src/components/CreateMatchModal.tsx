'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Calendar, ArrowRight, MapPin, Users, Clock, FileText } from 'lucide-react';
import { Match, INITIAL_ROSTER } from '@/types/football';
import { useClubStore } from '@/lib/club-store';

interface CreateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (match: Match) => void;
}

export default function CreateMatchModal({ isOpen, onClose, onCreate }: CreateMatchModalProps) {
  const router = useRouter();
  const { roster } = useClubStore();

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
    const baseRoster = (roster && roster.length > 0) ? roster : INITIAL_ROSTER;

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
      players: baseRoster.map((p) => ({ ...p, status: 'OUT' })),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl sm:max-w-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-zinc-800 bg-zinc-950/70 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg sm:text-xl">Tạo trận đấu mới</h3>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Thiết lập thông tin trận đấu, mở phòng điểm danh & chia đội sa bàn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 overflow-y-auto space-y-5 flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-zinc-200 mb-2 uppercase tracking-wide">
              Tên trận đấu <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Nội chiến FC Anh Em - Thứ 4 hàng tuần"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-sm sm:text-base text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-zinc-200 mb-2 uppercase tracking-wide">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Ngày thi đấu</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2.5 text-sm sm:text-base text-white focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-zinc-200 mb-2 uppercase tracking-wide">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Khung giờ thi đấu</span>
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="VD: 17:00 - 18:30"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2.5 text-sm sm:text-base text-white focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Venue & Maps URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-zinc-200 mb-2 uppercase tracking-wide">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Sân bóng / Địa điểm</span>
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="VD: Sân bóng D7 Phú Mỹ Hưng"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2.5 text-sm sm:text-base text-white focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-zinc-200 mb-2 uppercase tracking-wide">
                <span className="text-emerald-400">📍</span>
                <span>Link Google Maps</span>
              </label>
              <input
                type="url"
                value={venueMapUrl}
                onChange={(e) => setVenueMapUrl(e.target.value)}
                placeholder="https://maps.app.goo.gl/..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2.5 text-sm sm:text-base text-white focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Format & Target Players */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-zinc-200 mb-2 uppercase tracking-wide">
                Quy mô sân
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['5v5', '7v7', '11v11'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => handleFormatChange(fmt)}
                    className={`py-2.5 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                      format === fmt
                        ? 'bg-emerald-500 text-zinc-950 border-emerald-400 font-black shadow-md shadow-emerald-500/20'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-zinc-200 mb-2 uppercase tracking-wide">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Quân số mục tiêu (Người)</span>
              </label>
              <input
                type="number"
                min={2}
                max={50}
                value={targetPlayers}
                onChange={(e) => setTargetPlayers(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2.5 text-sm sm:text-base text-white font-mono font-bold focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Number of Teams */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-zinc-200 mb-2 uppercase tracking-wide">
              Chia làm mấy đội thi đấu?
            </label>
            <div className="grid grid-cols-3 gap-3">
              {([
                { num: 2 as const, label: '2 Đội', sub: 'Đối kháng trực tiếp' },
                { num: 3 as const, label: '3 Đội', sub: 'Tam hùng xoay tua' },
                { num: 4 as const, label: '4 Đội', sub: 'Tứ hùng chia bảng' },
              ]).map((item) => (
                <button
                  key={item.num}
                  type="button"
                  onClick={() => setNumberOfTeams(item.num)}
                  className={`py-3 px-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                    numberOfTeams === item.num
                      ? 'bg-emerald-500/15 border-emerald-500/60 text-white shadow-md shadow-emerald-500/10'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className={`font-bold text-sm sm:text-base ${numberOfTeams === item.num ? 'text-emerald-400' : 'text-zinc-200'}`}>
                      {item.label}
                    </span>
                    <span className={`w-2.5 h-2.5 rounded-full ${numberOfTeams === item.num ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-zinc-700'}`} />
                  </div>
                  <span className="text-[11px] sm:text-xs text-zinc-400">{item.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-zinc-200 mb-2 uppercase tracking-wide">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Ghi chú cho anh em (Màu áo, lưu ý...)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Mang 2 màu áo Cam & Xanh, đến trước 15p khởi động, chuẩn bị nước uống..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl text-sm text-zinc-400 hover:text-white font-semibold transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-bold text-sm sm:text-base shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>Tạo trận & Mở phòng</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

