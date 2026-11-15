'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, Clock, X, Check, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  label?: string;
}

export function DatePickerField({ value, onChange, label = 'Ngày thi đấu' }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Format date to Vietnamese string
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return 'Chọn ngày thi đấu...';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const weekday = d.toLocaleDateString('vi-VN', { weekday: 'long' });
        return `${weekday}, ${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  // Generate next 7 days for quick picking
  const quickDays = (() => {
    const list: { label: string; sub: string; dateStr: string; isToday: boolean; isTomorrow: boolean }[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      let label = d.toLocaleDateString('vi-VN', { weekday: 'short' });
      if (i === 0) label = 'Hôm nay';
      else if (i === 1) label = 'Ngày mai';

      const sub = `${day}/${month}`;
      list.push({
        label,
        sub,
        dateStr,
        isToday: i === 0,
        isTomorrow: i === 1,
      });
    }
    return list;
  })();

  return (
    <div className="relative" ref={popupRef}>
      <label className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-zinc-200 mb-2 uppercase tracking-wide">
        <CalendarIcon className="w-4 h-4 text-emerald-400" />
        <span>{label}</span>
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-zinc-950 border border-zinc-800 hover:border-emerald-500/60 rounded-2xl px-4 py-2.5 text-left text-sm sm:text-base text-white focus:outline-none focus:border-emerald-500 transition-all flex items-center justify-between cursor-pointer group"
      >
        <div className="flex items-center gap-2.5 truncate">
          <CalendarIcon className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className={value ? 'font-medium text-white' : 'text-zinc-500'}>
            {formatDateDisplay(value)}
          </span>
        </div>
        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
          Chọn ngày
        </span>
      </button>

      {/* Popup Dialog */}
      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 w-full sm:w-96 bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-2xl animate-in fade-in zoom-in-95 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white text-sm">Chọn ngày thi đấu</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Select Days */}
          <div>
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide block mb-2">
              Gợi ý các ngày tới
            </span>
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
              {quickDays.map((item) => {
                const isSelected = value === item.dateStr;
                return (
                  <button
                    key={item.dateStr}
                    type="button"
                    onClick={() => {
                      onChange(item.dateStr);
                      setIsOpen(false);
                    }}
                    className={`p-2 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-emerald-500 text-zinc-950 border-emerald-400 font-extrabold shadow-md shadow-emerald-500/20'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-xs font-bold leading-tight truncate w-full">{item.label}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-zinc-900 font-semibold' : 'text-zinc-500'}`}>
                      {item.sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calendar Native Picker */}
          <div className="pt-3 border-t border-zinc-800">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide block mb-1.5">
              Hoặc chọn ngày khác từ lịch
            </span>
            <input
              type="date"
              value={value}
              onChange={(e) => {
                if (e.target.value) {
                  onChange(e.target.value);
                  setIsOpen(false);
                }
              }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            />
          </div>

          {/* Current Selection summary */}
          {value && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 text-center">
              <span className="text-xs text-emerald-400 font-medium">
                Đã chọn: <strong className="font-bold text-white">{formatDateDisplay(value)}</strong>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface TimePickerProps {
  value: string; // e.g. "17:00 - 18:30"
  onChange: (time: string) => void;
  label?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

export function TimePickerField({ value, onChange, label = 'Khung giờ thi đấu' }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  // Parse initial start and end time (hours and minutes)
  const [startHour, setStartHour] = useState('17');
  const [startMinute, setStartMinute] = useState('30');
  const [endHour, setEndHour] = useState('19');
  const [endMinute, setEndMinute] = useState('00');

  useEffect(() => {
    if (value && value.includes('-')) {
      const parts = value.split('-').map((s) => s.trim());
      if (parts[0] && parts[0].includes(':')) {
        const [h, m] = parts[0].split(':');
        if (h !== undefined) setStartHour(h.trim().padStart(2, '0'));
        if (m !== undefined) setStartMinute(m.trim().padStart(2, '0'));
      }
      if (parts[1] && parts[1].includes(':')) {
        const [h, m] = parts[1].split(':');
        if (h !== undefined) setEndHour(h.trim().padStart(2, '0'));
        if (m !== undefined) setEndMinute(m.trim().padStart(2, '0'));
      }
    }
  }, [value, isOpen]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Calculate duration between start and end
  const calculateDuration = () => {
    const h1 = Number(startHour);
    const m1 = Number(startMinute);
    const h2 = Number(endHour);
    const m2 = Number(endMinute);
    if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return '';
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff < 0) diff += 24 * 60; // across midnight
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    if (hours === 0) return `${mins} phút`;
    if (mins === 0) return `${hours} tiếng (${diff} phút)`;
    return `${hours}h${mins > 0 ? `${mins}p` : ''} (${diff} phút)`;
  };

  const setQuickDuration = (minutes: number) => {
    const h = Number(startHour);
    const m = Number(startMinute);
    const total = h * 60 + m + minutes;
    const newH = Math.floor(total / 60) % 24;
    const newM = total % 60;
    setEndHour(String(newH).padStart(2, '0'));
    setEndMinute(String(newM).padStart(2, '0'));
  };

  const handleConfirm = () => {
    const formatted = `${startHour}:${startMinute} - ${endHour}:${endMinute}`;
    onChange(formatted);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={popupRef}>
      <label className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-zinc-200 mb-2 uppercase tracking-wide">
        <Clock className="w-4 h-4 text-emerald-400" />
        <span>{label}</span>
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-zinc-950 border border-zinc-800 hover:border-emerald-500/60 rounded-2xl px-4 py-2.5 text-left text-sm sm:text-base text-white focus:outline-none focus:border-emerald-500 transition-all flex items-center justify-between cursor-pointer group"
      >
        <div className="flex items-center gap-2.5 truncate">
          <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className={value ? 'font-medium text-white' : 'text-zinc-500'}>
            {value || 'Chọn khung giờ...'}
          </span>
        </div>
        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
          Chọn giờ
        </span>
      </button>

      {/* Popup Dialog */}
      {isOpen && (
        <div className="absolute top-full right-0 z-50 mt-2 w-full sm:w-[380px] bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl animate-in fade-in zoom-in-95 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white text-sm">Chọn khung giờ thi đấu</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Time Picker Selectors (Custom 24h format, no browser truncation) */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* Start Time Box */}
            <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-2">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide block">
                Từ (Giờ bắt đầu)
              </label>
              <div className="flex items-center justify-center gap-1 bg-zinc-900 border border-zinc-700/80 rounded-xl p-1.5 focus-within:border-emerald-500 transition-colors">
                <select
                  value={startHour}
                  onChange={(e) => setStartHour(e.target.value)}
                  className="bg-transparent text-emerald-400 font-mono font-black text-xl text-center focus:outline-none cursor-pointer px-1 py-1"
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h} className="bg-zinc-900 text-white font-mono">
                      {h}
                    </option>
                  ))}
                </select>
                <span className="text-xl font-black text-emerald-500/60 font-mono">:</span>
                <select
                  value={startMinute}
                  onChange={(e) => setStartMinute(e.target.value)}
                  className="bg-transparent text-emerald-400 font-mono font-black text-xl text-center focus:outline-none cursor-pointer px-1 py-1"
                >
                  {MINUTES.map((m) => (
                    <option key={m} value={m} className="bg-zinc-900 text-white font-mono">
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* End Time Box */}
            <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-2">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide block">
                Đến (Giờ kết thúc)
              </label>
              <div className="flex items-center justify-center gap-1 bg-zinc-900 border border-zinc-700/80 rounded-xl p-1.5 focus-within:border-teal-500 transition-colors">
                <select
                  value={endHour}
                  onChange={(e) => setEndHour(e.target.value)}
                  className="bg-transparent text-teal-400 font-mono font-black text-xl text-center focus:outline-none cursor-pointer px-1 py-1"
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h} className="bg-zinc-900 text-white font-mono">
                      {h}
                    </option>
                  ))}
                </select>
                <span className="text-xl font-black text-teal-500/60 font-mono">:</span>
                <select
                  value={endMinute}
                  onChange={(e) => setEndMinute(e.target.value)}
                  className="bg-transparent text-teal-400 font-mono font-black text-xl text-center focus:outline-none cursor-pointer px-1 py-1"
                >
                  {MINUTES.map((m) => (
                    <option key={m} value={m} className="bg-zinc-900 text-white font-mono">
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Quick Duration Buttons (Optional helper) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">
                Tính nhanh thời lượng
              </span>
              {calculateDuration() && (
                <span className="text-xs text-emerald-400 font-bold font-mono">
                  {calculateDuration()}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { mins: 60, label: '+60 phút' },
                { mins: 90, label: '+90 phút' },
                { mins: 120, label: '+120 phút' },
              ].map((item) => (
                <button
                  key={item.mins}
                  type="button"
                  onClick={() => setQuickDuration(item.mins)}
                  className="py-2 px-2 rounded-xl text-xs font-bold bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer text-center"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Current Selection summary & Confirm Button */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-3">
            <div className="text-xs text-zinc-300 truncate">
              Đã chọn: <strong className="text-white font-mono text-sm">{startHour}:{startMinute} - {endHour}:{endMinute}</strong>
            </div>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <span>Xác nhận</span>
              <Check className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

