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

export function TimePickerField({ value, onChange, label = 'Khung giờ thi đấu' }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  // Custom start and duration
  const [startTime, setStartTime] = useState('17:30');
  const [durationMinutes, setDurationMinutes] = useState(90);

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

  // Common football time slots in Vietnam
  const timePresets = [
    { label: '16:30 - 18:00', desc: 'Chiều sớm (90p)' },
    { label: '17:00 - 18:30', desc: 'Tan tầm (90p)' },
    { label: '17:30 - 19:00', desc: 'Hoàng hôn (90p)' },
    { label: '18:00 - 19:30', desc: 'Giờ vàng 1 (90p)' },
    { label: '18:30 - 20:00', desc: 'Giờ vàng 2 (90p)' },
    { label: '19:00 - 20:30', desc: 'Ca đẹp nhất (90p)' },
    { label: '19:30 - 21:00', desc: 'Ca tối 1 (90p)' },
    { label: '20:00 - 21:30', desc: 'Ca tối 2 (90p)' },
    { label: '20:30 - 22:00', desc: 'Ca khuya (90p)' },
  ];

  const calculateEndTime = (start: string, duration: number) => {
    const [h, m] = start.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return start;
    const totalMinutes = h * 60 + m + duration;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    const endHStr = String(endH).padStart(2, '0');
    const endMStr = String(endM).padStart(2, '0');
    return `${start} - ${endHStr}:${endMStr}`;
  };

  const handleApplyCustom = () => {
    const slot = calculateEndTime(startTime, durationMinutes);
    onChange(slot);
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
        <div className="absolute top-full right-0 z-50 mt-2 w-full sm:w-[420px] bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-2xl animate-in fade-in zoom-in-95 space-y-4 max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white text-sm">Chọn khung giờ thi đấu</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Football Presets */}
          <div>
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide block mb-2">
              Các khung giờ bóng đá phổ biến
            </span>
            <div className="grid grid-cols-3 gap-2">
              {timePresets.map((preset) => {
                const isSelected = value === preset.label;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      onChange(preset.label);
                      setIsOpen(false);
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-center items-center ${
                      isSelected
                        ? 'bg-emerald-500 text-zinc-950 border-emerald-400 font-extrabold shadow-md shadow-emerald-500/20'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    <span className="font-mono text-xs font-bold">{preset.label}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-zinc-900 font-semibold' : 'text-zinc-500'}`}>
                      {preset.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Time Selector */}
          <div className="pt-3 border-t border-zinc-800 space-y-2.5">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide block">
              Hoặc tùy chỉnh giờ bắt đầu & thời lượng
            </span>
            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">Giờ bắt đầu</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">Thời lượng</label>
                <div className="grid grid-cols-3 gap-1">
                  {[60, 90, 120].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDurationMinutes(mins)}
                      className={`py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                        durationMinutes === mins
                          ? 'bg-emerald-500 text-zinc-950 border-emerald-400'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      {mins}p
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleApplyCustom}
              className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-950 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Áp dụng ({calculateEndTime(startTime, durationMinutes)})</span>
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
