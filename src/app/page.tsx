'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Match, Player } from '@/types/football';
import { parseQuickPlayerList, balanceTeams } from '@/lib/balance';
import {
  Trophy,
  Users,
  Sparkles,
  Share2,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  ClipboardList,
  CheckCircle,
  Shield,
  Layers,
  History,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  // Form states
  const [title, setTitle] = useState('Nội chiến FC Anh Em - Thứ 5');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('20:00 - 21:30');
  const [venue, setVenue] = useState('Sân bóng Chuyên Việt (Quận 7)');
  const [format, setFormat] = useState<'5v5' | '7v7' | '11v11'>('7v7');
  const [targetPlayers, setTargetPlayers] = useState(14);
  const [numberOfTeams, setNumberOfTeams] = useState<2 | 3 | 4>(2);
  const [notes, setNotes] = useState('Anh em mang 2 áo (Áo Cam & Áo Xanh dương)');
  const [initialPlayersText, setInitialPlayersText] = useState(`1. Hoàng Long (GK) - 8đ
2. Minh Tuấn - DEF - 7đ
3. Văn Đức - DEF - 7đ
4. Quang Hải - MID - 9đ
5. Hùng Dũng - MID - 8đ
6. Tiến Linh - FWD - 8đ
7. Tuấn Hải - FWD - 8đ
8. Văn Lâm - GK - 9đ
9. Quế Ngọc Hải - DEF - 8đ
10. Thành Chung - DEF - 7đ
11. Hoàng Đức - MID - 9đ
12. Công Phượng - FWD - 8đ
13. Văn Toàn - FWD - 7đ
14. Bùi Tiến Dũng - DEF - 8đ`);

  const [recentMatches, setRecentMatches] = useState<
    { id: string; title: string; date: string; time: string; updatedAt: number }[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Set default date
    const today = new Date();
    setDate(today.toISOString().split('T')[0]);

    // Load recent matches
    const recentRaw = localStorage.getItem('footdraw_recent_matches');
    if (recentRaw) {
      try {
        setRecentMatches(JSON.parse(recentRaw));
      } catch {
        // ignore
      }
    }
  }, []);

  // Update target players when format changes
  const handleFormatChange = (newFormat: '5v5' | '7v7' | '11v11') => {
    setFormat(newFormat);
    if (newFormat === '5v5') setTargetPlayers(10);
    if (newFormat === '7v7') setTargetPlayers(14);
    if (newFormat === '11v11') setTargetPlayers(22);
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tên trận đấu!');
      return;
    }

    setIsSubmitting(true);

    // Generate unique short slug ID
    const matchId = `match_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    // Parse initial players if provided
    let players: Player[] = [];
    if (initialPlayersText.trim()) {
      const parsed = parseQuickPlayerList(initialPlayersText);
      players = parsed.map((p, idx) => ({
        ...p,
        id: `p_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 5)}`,
      }));
    }

    // Auto-draw teams if we already have players
    const activeOnes = players.filter((p) => p.status === 'IN');
    const initialTeams = activeOnes.length >= 2 ? balanceTeams(activeOnes, numberOfTeams) : [];

    const newMatch: Match = {
      id: matchId,
      title: title.trim(),
      date,
      time: time.trim(),
      venue: venue.trim(),
      format,
      targetPlayers,
      numberOfTeams,
      notes: notes.trim(),
      status: 'SCHEDULED',
      players,
      teams: initialTeams,
      isDrawn: initialTeams.length > 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Save to local storage
    if (typeof window !== 'undefined') {
      localStorage.setItem(`footdraw_match_${matchId}`, JSON.stringify(newMatch));

      // Save to club matches list
      try {
        const matchesRaw = localStorage.getItem('footdraw_club_matches');
        let clubMatches = matchesRaw ? JSON.parse(matchesRaw) : [];
        clubMatches.unshift(newMatch);
        localStorage.setItem('footdraw_club_matches', JSON.stringify(clubMatches));
      } catch {
        // ignore
      }

      // Save to recent list
      try {
        const recentRaw = localStorage.getItem('footdraw_recent_matches');
        let recent = recentRaw ? JSON.parse(recentRaw) : [];
        recent = recent.filter((r: { id: string }) => r.id !== matchId);
        recent.unshift({
          id: matchId,
          title: newMatch.title,
          date: newMatch.date,
          time: newMatch.time,
          updatedAt: Date.now(),
        });
        localStorage.setItem('footdraw_recent_matches', JSON.stringify(recent.slice(0, 10)));
      } catch {
        // ignore
      }
    }

    // Also send to Next.js API endpoint for memory caching
    try {
      await fetch(`/api/matches/${matchId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMatch),
      });
    } catch {
      // ignore
    }

    // Redirect to match room
    router.push(`/match/${matchId}`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col selection:bg-emerald-500 selection:text-zinc-950">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 sm:py-12 w-full flex-1 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Nền tảng Quản lý Trận & Chia đội Phủi Thông Minh</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Tổ chức đá bóng phủi <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Nhanh gọn • Công bằng • Không cãi vã
            </span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Tạo link phòng thi đấu trong 10 giây ➔ Gửi vào nhóm Zalo để anh em tự điểm danh ➔ Thuật toán tự động cân bằng thủ môn & điểm số trình độ!
          </p>
        </div>

        {/* Create Match Card Form */}
        <div className="max-w-2xl mx-auto bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3 pb-5 border-b border-zinc-800 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl font-bold">
              ⚽
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Tạo trận đấu mới</h2>
              <p className="text-xs text-zinc-400">Sinh link chia sẻ ngay sau khi bấm tạo</p>
            </div>
          </div>

          <form onSubmit={handleCreateMatch} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-zinc-200 mb-1.5 uppercase tracking-wide">
                Tên trận đấu <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: FC Anh Em - Kèo Thứ 5 Sân Chuyên Việt"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors font-medium"
              />
            </div>

            {/* Date, Time, Venue */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-200 mb-1.5 uppercase tracking-wide">
                  Ngày thi đấu
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-200 mb-1.5 uppercase tracking-wide">
                  Khung giờ
                </label>
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="VD: 19:30 - 21:00"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Venue */}
            <div>
              <label className="block text-xs font-bold text-zinc-200 mb-1.5 uppercase tracking-wide">
                Địa điểm / Sân bóng
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="VD: Sân bóng Chuyên Việt, Quận 7"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Match Format & Target Players */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-zinc-200 mb-1.5 uppercase tracking-wide">
                  Quy mô sân
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['5v5', '7v7', '11v11'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => handleFormatChange(fmt)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        format === fmt
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-200 mb-1.5 uppercase tracking-wide">
                  Mục tiêu quân số (Người)
                </label>
                <input
                  type="number"
                  min={2}
                  max={60}
                  value={targetPlayers}
                  onChange={(e) => setTargetPlayers(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
                />
              </div>
            </div>

            {/* Number of Teams */}
            <div>
              <label className="block text-xs font-bold text-zinc-200 mb-1.5 uppercase tracking-wide">
                Chia làm mấy đội?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([2, 3, 4] as const).map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setNumberOfTeams(num)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      numberOfTeams === num
                        ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-md'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    {num} Đội {num === 2 ? '(Đối kháng)' : num === 3 ? '(Tam hùng)' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Initial Roster Paste (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-200 uppercase tracking-wide">
                  Dán danh sách anh em cố định (Tùy chọn)
                </label>
                <span className="text-[11px] text-zinc-400">Có thể dán từ Zalo</span>
              </div>
              <textarea
                value={initialPlayersText}
                onChange={(e) => setInitialPlayersText(e.target.value)}
                rows={5}
                placeholder="1. Nguyễn Văn A (GK)&#10;2. Trần Văn B - DEF&#10;3. Lê Văn C - MID..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 font-mono text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-zinc-200 mb-1.5 uppercase tracking-wide">
                Ghi chú cho anh em (Màu áo, tiền sân...)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="VD: Anh em mang áo Cam và áo Xanh, đến trước 15p khởi động"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-emerald-500/25 transition-all transform active:scale-98 cursor-pointer disabled:opacity-50"
            >
              <span>Tạo trận đấu & Mở phòng ngay</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        </div>

        {/* Recent Matches on This Machine */}
        {recentMatches.length > 0 && (
          <div className="max-w-2xl mx-auto space-y-3">
            <div className="flex items-center gap-2 text-zinc-300 font-bold text-sm">
              <History className="w-4 h-4 text-emerald-400" />
              <span>Trận đấu gần đây của bạn</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentMatches.slice(0, 4).map((m) => (
                <div
                  key={m.id}
                  onClick={() => router.push(`/match/${m.id}`)}
                  className="p-4 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800 hover:border-emerald-500/50 cursor-pointer transition-all group shadow-md"
                >
                  <h4 className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors line-clamp-1">
                    {m.title}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    {m.date} {m.time ? `• ${m.time}` : ''}
                  </p>
                  <span className="text-[11px] text-emerald-400 font-semibold inline-flex items-center gap-1 mt-2">
                    Vào phòng đấu →
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-zinc-900">
          <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/60 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Chia Đội Cân Bằng Tuyệt Đối</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Tách đều thủ môn GK cho mỗi đội, chia đều các vị trí DEF, MID, FWD và tối thiểu hoá chênh lệch tổng điểm rating.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/60 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Chia Sẻ Link Realtime</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Gửi link phòng đấu vào Zalo để từng thành viên tự bấm vào xác nhận tham gia. Số người nhảy realtime trên màn hình.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800/60 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Sa Bàn & Xuất Ảnh Zalo</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Xem sa bàn sân cỏ sinh động, hoán đổi cầu thủ thủ công, xuất ảnh PNG sắc nét hoặc copy tin nhắn format sẵn gửi Zalo.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-400">
        <p>FootDraw VN • Quản lý đội bóng & Chia đội phủi chuẩn xác</p>
      </footer>
    </div>
  );
}
