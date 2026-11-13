'use client';

import React, { useState, useEffect, useMemo, use, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { AttendancePoll, PollVote, Player, POSITION_LABELS } from '@/types/football';
import { useAdminAuth } from '@/context/AdminAuthContext';
import confetti from 'canvas-confetti';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  Share2,
  Check,
  Sparkles,
  ArrowRight,
  Shield,
  RefreshCw,
  Lock,
  Unlock,
  AlertCircle,
  ChevronDown,
  UserCheck,
} from 'lucide-react';

export default function PollPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PollContent params={params} />
    </Suspense>
  );
}

function PollContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const pollId = resolvedParams.id;
  const router = useRouter();

  const [poll, setPoll] = useState<AttendancePoll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Voter state
  const [voterName, setVoterName] = useState('');
  const [selectedRosterPlayer, setSelectedRosterPlayer] = useState<Player | null>(null);
  const [clubRoster, setClubRoster] = useState<Player[]>([]);
  const [rememberedName, setRememberedName] = useState('');
  const [showChangeName, setShowChangeName] = useState(false);

  // Admin auth context (Default: always Member, requires password 'xsofts' to unlock)
  const { isAdmin, openPasswordModal, logoutAdmin } = useAdminAuth();

  // Fetch Poll from API
  const fetchPoll = useCallback(async () => {
    try {
      const res = await fetch(`/api/polls/${pollId}`);
      if (!res.ok) {
        throw new Error('Không tìm thấy thông tin đợt điểm danh này.');
      }
      const data = await res.json();
      setPoll(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Lỗi khi tải dữ liệu.');
      }
    } finally {
      setLoading(false);
    }
  }, [pollId]);

  // Initial load
  useEffect(() => {
    fetchPoll();

    // Check remembered name
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('footdraw_voter_name') || '';
      setRememberedName(savedName);

      // Load roster for quick dropdown
      fetch('/api/players')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setClubRoster(data);
        })
        .catch(() => {});
    }

    // Auto-refresh poll every 8 seconds for live sync
    const interval = setInterval(() => {
      fetchPoll();
    }, 8000);

    return () => clearInterval(interval);
  }, [fetchPoll, pollId]);

  // Derived lists
  const yesVotes = useMemo(() => {
    return poll?.votes.filter((v) => v.status === 'YES') || [];
  }, [poll?.votes]);

  const noVotes = useMemo(() => {
    return poll?.votes.filter((v) => v.status === 'NO') || [];
  }, [poll?.votes]);

  // Active filter tab
  const [filterTab, setFilterTab] = useState<'YES' | 'NO' | 'ALL'>('YES');

  const displayedVotes = useMemo(() => {
    if (!poll) return [];
    if (filterTab === 'YES') return yesVotes;
    if (filterTab === 'NO') return noVotes;
    return poll.votes;
  }, [poll, filterTab, yesVotes, noVotes]);

  // My current vote if name is remembered
  const myVote = useMemo(() => {
    if (!poll || !rememberedName.trim()) return null;
    return (
      poll.votes.find(
        (v) => v.playerName.trim().toLowerCase() === rememberedName.trim().toLowerCase()
      ) || null
    );
  }, [poll, rememberedName]);

  // Cast vote
  const handleVote = async (status: 'YES' | 'NO', nameOverride?: string) => {
    const targetName = (nameOverride || voterName).trim();
    if (!targetName) {
      alert('Vui lòng nhập họ tên của bạn để điểm danh!');
      return;
    }

    setIsSubmittingVote(true);
    try {
      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: targetName,
          status,
          playerId: selectedRosterPlayer?.id,
          position: selectedRosterPlayer?.position,
          rating: selectedRosterPlayer?.rating,
        }),
      });

      if (!res.ok) {
        throw new Error('Không thể ghi nhận điểm danh. Vui lòng thử lại!');
      }

      const updatedPoll: AttendancePoll = await res.json();
      setPoll(updatedPoll);

      // Save name to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('footdraw_voter_name', targetName);
        setRememberedName(targetName);
      }

      setVoterName('');
      setSelectedRosterPlayer(null);
      setShowChangeName(false);

      if (status === 'YES') {
        try {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.65 },
            colors: ['#10b981', '#3b82f6', '#f59e0b'],
          });
        } catch {
          // ignore
        }
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi khi gửi bình chọn.');
    } finally {
      setIsSubmittingVote(false);
    }
  };

  // Copy share message for Zalo
  const handleCopyLink = () => {
    if (!poll || typeof window === 'undefined') return;
    const shareText = `⚽ ĐIỂM DANH ĐÁ BÓNG: ${poll.title}
📅 Ngày: ${poll.date || 'Sắp tới'}
⏰ Giờ: ${poll.time || 'Chưa cập nhật'}
📍 Sân: ${poll.venue || 'Chưa cập nhật'}
👥 Đã có: ${yesVotes.length}/${poll.targetPlayers} người xác nhận
${poll.notes ? `💬 Ghi chú: ${poll.notes}\n` : ''}
👉 Anh em vào bấm điểm danh tại link này nhé:
${window.location.href}`;

    navigator.clipboard.writeText(shareText);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Admin: Draw Teams from this Poll
  const handleProceedToDraw = () => {
    if (!poll) return;
    if (yesVotes.length < 2) {
      alert('Cần ít nhất 2 cầu thủ xác nhận "Có mặt" để tiến hành chia đội!');
      return;
    }
    router.push(`/draw?pollId=${poll.id}`);
  };

  // Toggle Admin status via password modal or logout
  const handleToggleAdmin = () => {
    if (isAdmin) {
      logoutAdmin();
    } else {
      openPasswordModal();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 animate-spin">
            <RefreshCw className="w-6 h-6" />
          </div>
          <p className="text-zinc-400 text-sm">Đang tải thông tin điểm danh...</p>
        </div>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Không tìm thấy đợt điểm danh</h2>
          <p className="text-zinc-400 text-xs leading-relaxed mb-6">
            Đường link này có thể đã hết hạn hoặc không tồn tại. Vui lòng liên hệ Đội trưởng hoặc kiểm tra lại đường link.
          </p>
          <Link
            href="/polls"
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20"
          >
            ← Về danh sách đợt điểm danh
          </Link>
        </div>
      </div>
    );
  }

  const isTargetMet = yesVotes.length >= poll.targetPlayers;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col selection:bg-emerald-500 selection:text-zinc-950">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-6 w-full flex-1 space-y-5">
        {/* Admin Bar */}
        <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <span className="font-bold text-amber-400 flex items-center gap-1">
                <Unlock className="w-3.5 h-3.5" />
                <span>Quyền Đội trưởng (Admin)</span>
              </span>
            ) : (
              <span className="text-zinc-400 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                <span>Giao diện Điểm danh Thành viên</span>
              </span>
            )}
          </div>

          <button
            onClick={handleToggleAdmin}
            className="text-[11px] text-zinc-400 hover:text-white underline cursor-pointer"
          >
            {isAdmin ? 'Đổi sang giao diện Thành viên' : 'Bạn là Đội trưởng? Mở quyền'}
          </button>
        </div>

        {/* Match Header Card */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
                  {poll.format}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-xs font-medium">
                  {poll.status === 'OPEN' ? '🟢 Đang mở điểm danh' : '🔴 Đã chốt điểm danh'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {poll.title}
              </h1>

              {/* Match Meta (Date, Time, Venue) */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-xs sm:text-sm text-zinc-300">
                {poll.date && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <span>{poll.date}</span>
                  </div>
                )}
                {poll.time && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span>{poll.time}</span>
                  </div>
                )}
                {poll.venue && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span>{poll.venue}</span>
                  </div>
                )}
              </div>

              {poll.notes && (
                <div className="mt-3 text-xs text-zinc-300 bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800/80">
                  💬 <strong className="text-zinc-200">Ghi chú:</strong> {poll.notes}
                </div>
              )}
            </div>

            {/* Actions: Copy Link to Zalo */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                onClick={handleCopyLink}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-lg active:scale-95 ${
                  copiedLink
                    ? 'bg-emerald-500 text-zinc-950'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950'
                }`}
              >
                {copiedLink ? <Check className="w-4 h-4 stroke-[3]" /> : <Share2 className="w-4 h-4" />}
                <span>{copiedLink ? 'Đã copy tin nhắn Zalo!' : 'Copy link gửi Zalo'}</span>
              </button>
            </div>
          </div>

          {/* Attendance Progress Track */}
          <div className="mt-5 pt-4 border-t border-zinc-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-300">Tiến độ xác nhận:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-md ${
                    isTargetMet
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {yesVotes.length} / {poll.targetPlayers} cầu thủ
                </span>
                {noVotes.length > 0 && (
                  <span className="text-rose-400 text-xs">({noVotes.length} báo bận)</span>
                )}
              </div>
              <span className="text-zinc-400 text-[11px]">
                {isTargetMet ? '🎉 Đã đủ quân số đá!' : `Cần thêm ${poll.targetPlayers - yesVotes.length} người`}
              </span>
            </div>

            <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-800">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isTargetMet ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-emerald-400'
                }`}
                style={{
                  width: `${Math.min(100, (yesVotes.length / poll.targetPlayers) * 100)}%`,
                }}
              />
            </div>
          </div>
        </section>

        {/* Admin Action: Draw Teams Button */}
        {isAdmin && (
          <section className="bg-gradient-to-r from-emerald-900/40 via-teal-900/30 to-zinc-900 border border-emerald-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Chuyển sang Chia Đội</h3>
                <p className="text-xs text-zinc-400">
                  Lấy toàn bộ <strong className="text-emerald-400">{yesVotes.length} cầu thủ</strong> có mặt sang thuật toán cân bằng đội
                </p>
              </div>
            </div>

            <button
              onClick={handleProceedToDraw}
              disabled={yesVotes.length < 2}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-50 text-zinc-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/25 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>⚡ Chia Đội Ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </section>
        )}

        {/* RSVP Check-in Section (Mobile-First) */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-800 mb-4">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Xác nhận tham gia</h2>
              <p className="text-xs text-zinc-400">Bạn có ra sân trận này không?</p>
            </div>
          </div>

          {/* Case 1: Returning recognized voter */}
          {myVote && !showChangeName ? (
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">Xin chào,</span>
                    <strong className="text-sm text-white">{myVote.playerName}</strong>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300">
                      (Bạn)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-zinc-400">Trạng thái:</span>
                    {myVote.status === 'YES' ? (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500/20" />
                        ĐÃ XÁC NHẬN CÓ MẶT (ĐI ĐÁ)
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-rose-400 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        ĐÃ BÁO BẬN (KHÔNG ĐI)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {myVote.status === 'YES' ? (
                  <button
                    onClick={() => handleVote('NO', myVote.playerName)}
                    disabled={isSubmittingVote}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-zinc-800 hover:bg-rose-950/40 text-rose-300 hover:text-rose-200 border border-zinc-700 hover:border-rose-500/40 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                  >
                    Đổi sang Báo bận (Nghỉ)
                  </button>
                ) : (
                  <button
                    onClick={() => handleVote('YES', myVote.playerName)}
                    disabled={isSubmittingVote}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
                  >
                    ✅ Đổi sang Tham gia (Đi đá)
                  </button>
                )}

                <button
                  onClick={() => setShowChangeName(true)}
                  className="text-xs text-zinc-400 hover:text-white px-2 py-1.5 underline"
                >
                  Điểm danh tên khác
                </button>
              </div>
            </div>
          ) : (
            /* Case 2: New Voter Form */
            <div className="space-y-3">
              {/* Dropdown to pick from club roster */}
              {clubRoster.length > 0 && (
                <div>
                  <label className="block text-xs text-zinc-400 font-medium mb-1">
                    Chọn tên bạn trong danh sách đội bóng:
                  </label>
                  <div className="relative">
                    <select
                      value={selectedRosterPlayer?.id || ''}
                      onChange={(e) => {
                        const player = clubRoster.find((p) => p.id === e.target.value);
                        if (player) {
                          setSelectedRosterPlayer(player);
                          setVoterName(player.name);
                        } else {
                          setSelectedRosterPlayer(null);
                        }
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white appearance-none focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">-- Chọn thành viên FC hoặc tự nhập bên dưới --</option>
                      {clubRoster.map((player) => {
                        const isVoted = poll.votes.some(
                          (v) => v.playerName.toLowerCase() === player.name.toLowerCase()
                        );
                        return (
                          <option key={player.id} value={player.id}>
                            {player.name} ({player.position}) {isVoted ? '• Đã điểm danh' : ''}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Text input for custom guest name */}
              <div>
                <label className="block text-xs text-zinc-400 font-medium mb-1">
                  Hoặc tự nhập tên của bạn:
                </label>
                <input
                  type="text"
                  value={voterName}
                  onChange={(e) => {
                    setVoterName(e.target.value);
                    if (selectedRosterPlayer && selectedRosterPlayer.name !== e.target.value) {
                      setSelectedRosterPlayer(null);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleVote('YES');
                  }}
                  placeholder="Ví dụ: Hoàng Long, Tuấn Khang (Khách)..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={() => handleVote('YES')}
                  disabled={isSubmittingVote || !voterName.trim()}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>✅ Tôi Tham Gia (Đi đá)</span>
                </button>

                <button
                  onClick={() => handleVote('NO')}
                  disabled={isSubmittingVote || !voterName.trim()}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-rose-950/40 text-rose-300 hover:text-rose-200 disabled:opacity-50 border border-zinc-700 hover:border-rose-500/40 font-semibold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>❌ Báo Bận (Không đi)</span>
                </button>
              </div>

              {showChangeName && (
                <div className="text-right">
                  <button
                    onClick={() => setShowChangeName(false)}
                    className="text-xs text-zinc-500 hover:text-white"
                  >
                    Quay lại
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Attendees List Section */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-base text-white">Danh sách điểm danh</h3>
            </div>
            <span className="text-xs text-zinc-400">
              Tổng số vote: <strong className="text-white">{poll.votes.length}</strong>
            </span>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-zinc-950 rounded-xl border border-zinc-800 mb-3 text-xs">
            <button
              onClick={() => setFilterTab('YES')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-colors ${
                filterTab === 'YES'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-emerald-400'
              }`}
            >
              Đi đá ({yesVotes.length})
            </button>
            <button
              onClick={() => setFilterTab('NO')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-colors ${
                filterTab === 'NO'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-rose-400'
              }`}
            >
              Báo bận ({noVotes.length})
            </button>
            <button
              onClick={() => setFilterTab('ALL')}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
                filterTab === 'ALL'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Tất cả ({poll.votes.length})
            </button>
          </div>

          {/* Attendees List */}
          <div className="space-y-1.5 max-h-[450px] overflow-y-auto pr-1">
            {displayedVotes.length === 0 ? (
              <div className="text-center py-10 text-zinc-500 text-xs">
                Chưa có ai trong danh sách này.
              </div>
            ) : (
              displayedVotes.map((vote, idx) => {
                const isYes = vote.status === 'YES';
                const pos = vote.position ? POSITION_LABELS[vote.position] : null;
                const isMe =
                  rememberedName &&
                  vote.playerName.trim().toLowerCase() === rememberedName.trim().toLowerCase();

                return (
                  <div
                    key={vote.id || idx}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      isMe
                        ? 'bg-emerald-950/30 border-emerald-500/50 ring-1 ring-emerald-500/30'
                        : isYes
                        ? 'bg-zinc-950/80 border-zinc-800'
                        : 'bg-zinc-950/40 border-zinc-900 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xs text-zinc-500 w-5 font-mono">{idx + 1}.</span>

                      {/* Status Icon */}
                      {isYes ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}

                      {/* Position Badge if available */}
                      {pos && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${pos.badgeClass} shrink-0`}
                        >
                          {vote.position}
                        </span>
                      )}

                      {/* Name */}
                      <span className="text-sm font-semibold text-white truncate">
                        {vote.playerName}
                      </span>

                      {isMe && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold shrink-0">
                          Bạn
                        </span>
                      )}
                    </div>

                    <div className="shrink-0 text-right">
                      <span
                        className={`text-xs font-semibold ${
                          isYes ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isYes ? 'Tham gia' : 'Bận'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
