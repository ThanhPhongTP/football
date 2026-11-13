'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { AttendancePoll } from '@/types/football';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Share2,
  Check,
  Sparkles,
  ArrowRight,
  Trash2,
  ExternalLink,
  ClipboardList,
  AlertCircle,
  X,
} from 'lucide-react';

export default function PollsPage() {
  const { isAdmin, openPasswordModal } = useAdminAuth();
  const [polls, setPolls] = useState<AttendancePoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal create state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('20:00 - 21:30');
  const [venue, setVenue] = useState('Sân Chuyên Việt (Quận 7)');
  const [format, setFormat] = useState<'5v5' | '7v7' | '11v11'>('7v7');
  const [targetPlayers, setTargetPlayers] = useState(14);
  const [notes, setNotes] = useState('Anh em mang 2 áo Cam & Xanh, đến trước 15p khởi động!');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load polls from server
  const fetchPolls = async () => {
    try {
      const res = await fetch('/api/polls');
      if (res.ok) {
        const data = await res.json();
        setPolls(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();
    const today = new Date();
    setDate(today.toISOString().split('T')[0]);
    setTitle(`Nội chiến Tuần ${getWeekNumber(today)} - FC Anh Em`);
  }, []);

  const handleFormatChange = (newFormat: '5v5' | '7v7' | '11v11') => {
    setFormat(newFormat);
    if (newFormat === '5v5') setTargetPlayers(10);
    if (newFormat === '7v7') setTargetPlayers(14);
    if (newFormat === '11v11') setTargetPlayers(22);
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tên đợt điểm danh!');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          date,
          time: time.trim(),
          venue: venue.trim(),
          format,
          targetPlayers,
          notes: notes.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error('Lỗi khi tạo đợt điểm danh');
      }

      const created: AttendancePoll = await res.json();
      setPolls((prev) => [created, ...prev]);
      setIsCreateOpen(false);

      if (typeof window !== 'undefined') {
        localStorage.setItem(`footdraw_poll_admin_${created.id}`, 'true');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi khi tạo đợt điểm danh.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePoll = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc muốn xóa đợt điểm danh này?')) return;

    try {
      const res = await fetch(`/api/polls/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPolls((prev) => prev.filter((p) => p.id !== id));
      }
    } catch {
      alert('Không thể xóa đợt điểm danh.');
    }
  };

  const handleCopyLink = (poll: AttendancePoll, e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window === 'undefined') return;

    const yesCount = poll.votes.filter((v) => v.status === 'YES').length;
    const pollUrl = `${window.location.origin}/poll/${poll.id}`;

    const text = `⚽ ĐIỂM DANH ĐÁ BÓNG: ${poll.title}
📅 Ngày: ${poll.date}
⏰ Giờ: ${poll.time}
📍 Sân: ${poll.venue}
👥 Đã có: ${yesCount}/${poll.targetPlayers} người xác nhận
${poll.notes ? `💬 Ghi chú: ${poll.notes}\n` : ''}
👉 Anh em bấm vào link để điểm danh:
${pollUrl}`;

    navigator.clipboard.writeText(text);
    setCopiedId(poll.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col selection:bg-emerald-500 selection:text-zinc-950">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 w-full flex-1 space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
                FootDraw Attendance
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <ClipboardList className="w-7 h-7 text-emerald-400" />
              <span>Điểm Danh Trận Đấu (Polls)</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Tạo link bình chọn gửi Zalo/Telegram. Anh em vào chọn Có/Bận, hệ thống tự động kiểm đếm quân số.
            </p>
          </div>

          {isAdmin ? (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/20 transition-all transform active:scale-95 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Tạo Đợt Điểm Danh Mới</span>
            </button>
          ) : (
            <button
              onClick={openPasswordModal}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-semibold transition-all shadow-sm cursor-pointer shrink-0"
            >
              <span>🔑 Đội trưởng tạo lịch</span>
            </button>
          )}
        </div>

        {/* Polls Grid */}
        {loading ? (
          <div className="py-20 text-center text-zinc-500 text-sm">
            Đang tải danh sách đợt điểm danh...
          </div>
        ) : polls.length === 0 ? (
          <div className="p-12 text-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/40 space-y-3 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 mx-auto flex items-center justify-center text-2xl">
              📋
            </div>
            <h3 className="font-bold text-white text-base">Chưa có đợt điểm danh nào</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Hãy bấm nút &quot;Tạo Đợt Điểm Danh Mới&quot; để sinh link gửi vào nhóm chat Zalo cho anh em đăng ký!
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs"
            >
              + Tạo ngay
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {polls.map((poll) => {
              const yesVotes = poll.votes.filter((v) => v.status === 'YES');
              const isTargetMet = yesVotes.length >= poll.targetPlayers;
              const isCopied = copiedId === poll.id;

              return (
                <div
                  key={poll.id}
                  className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-3xl p-5 shadow-xl flex flex-col justify-between transition-all group"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                        {poll.format}
                      </span>
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {poll.status === 'OPEN' ? '🟢 Mở điểm danh' : '🔴 Đã đóng'}
                      </span>
                    </div>

                    {/* Title */}
                    <Link
                      href={`/poll/${poll.id}`}
                      className="block text-base font-bold text-white hover:text-emerald-400 transition-colors line-clamp-1"
                    >
                      {poll.title}
                    </Link>

                    {/* Meta info */}
                    <div className="space-y-1 mt-2.5 text-xs text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{poll.date}</span>
                        <span>•</span>
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{poll.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{poll.venue}</span>
                      </div>
                    </div>

                    {/* Attendance Progress Bar */}
                    <div className="mt-4 pt-3 border-t border-zinc-800/80">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-zinc-400">Quân số xác nhận:</span>
                        <span
                          className={`font-bold ${isTargetMet ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                        >
                          {yesVotes.length} / {poll.targetPlayers}
                        </span>
                      </div>
                      <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800">
                        <div
                          className={`h-full rounded-full transition-all ${isTargetMet ? 'bg-emerald-500' : 'bg-amber-400'
                            }`}
                          style={{
                            width: `${Math.min(100, (yesVotes.length / poll.targetPlayers) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="mt-5 pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
                    <button
                      onClick={(e) => handleCopyLink(poll, e)}
                      title="Copy link kèm thông tin trận gửi Zalo"
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${isCopied
                          ? 'bg-emerald-500 text-zinc-950 border-emerald-400'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                        }`}
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Đã copy!' : 'Copy Zalo'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {isAdmin ? (
                        <Link
                          href={`/draw?pollId=${poll.id}`}
                          title="Đưa những người có mặt sang chia đội"
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Chia đội</span>
                        </Link>
                      ) : (
                        <button
                          onClick={openPasswordModal}
                          title="Nhập mật khẩu để mở quyền chia đội"
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-semibold text-xs transition-all"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Chia đội</span>
                        </button>
                      )}

                      <Link
                        href={`/poll/${poll.id}`}
                        title="Mở trang điểm danh"
                        className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>

                      {isAdmin && (
                        <button
                          onClick={(e) => handleDeletePoll(poll.id, e)}
                          title="Xóa đợt điểm danh"
                          className="p-1.5 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal: Create Attendance Poll */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-lg text-white">Tạo Đợt Điểm Danh Mới</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePoll} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Tên trận đấu / đợt đá:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Nội chiến Thứ 5 - FC Anh Em"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Format Selector */}
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Thể thức sân bóng:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['5v5', '7v7', '11v11'] as const).map((fmt) => (
                    <button
                      type="button"
                      key={fmt}
                      onClick={() => handleFormatChange(fmt)}
                      className={`py-2 rounded-xl font-bold border transition-all ${format === fmt
                          ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-md'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                        }`}
                    >
                      Sân {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Ngày thi đấu:</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Khung giờ:</label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="20:00 - 21:30"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-zinc-300 font-semibold mb-1">Địa điểm / Sân bóng:</label>
                  <input
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="VD: Sân Chuyên Việt (Q7)"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Sĩ số cần:</label>
                  <input
                    type="number"
                    min="4"
                    max="40"
                    value={targetPlayers}
                    onChange={(e) => setTargetPlayers(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-bold text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Ghi chú (Áo, tiền sân, lưu ý):</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="VD: Mang áo 2 màu, đến trước 15p..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Đang tạo...' : 'Tạo đợt điểm danh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

