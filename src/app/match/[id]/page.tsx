'use client';

import React, { useState, useMemo, use, Suspense } from 'react';
import { useMatchSync } from '@/lib/sync';
import { balanceTeams, swapPlayersBetweenTeams } from '@/lib/balance';
import { formatZaloTextMessage, downloadPitchAsPng } from '@/lib/export';
import { Player, Team, POSITION_LABELS } from '@/types/football';
import Navbar from '@/components/Navbar';
import AddPlayerModal from '@/components/AddPlayerModal';
import QuickPasteModal from '@/components/QuickPasteModal';
import FootballPitchView from '@/components/FootballPitchView';
import TeamCard from '@/components/TeamCard';
import confetti from 'canvas-confetti';
import {
  Users,
  Copy,
  Check,
  Share2,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  RefreshCw,
  Download,
  FileText,
  UserPlus,
  ClipboardList,
  Edit2,
  Trash2,
  Star,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';

export default function MatchRoomPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <MatchRoomContent params={params} />
    </Suspense>
  );
}

function MatchRoomContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const matchId = resolvedParams.id;

  const { match, saveMatch, isSyncing, isCloudEnabled } = useMatchSync(matchId);

  // Modals state
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [isQuickPasteOpen, setIsQuickPasteOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // UI state
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [attendanceFilter, setAttendanceFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [activeTab, setActiveTab] = useState<'pitch' | 'cards'>('pitch');
  const [selectedPlayerForSwap, setSelectedPlayerForSwap] = useState<Player | null>(null);
  const [selfCheckInName, setSelfCheckInName] = useState('');
  const [showSelfCheckIn, setShowSelfCheckIn] = useState(false);

  // Derived attendance stats
  const activePlayers = useMemo(() => {
    return match?.players.filter((p) => p.status === 'IN') || [];
  }, [match?.players]);

  const outPlayers = useMemo(() => {
    return match?.players.filter((p) => p.status === 'OUT') || [];
  }, [match?.players]);

  const filteredPlayers = useMemo(() => {
    if (!match) return [];
    if (attendanceFilter === 'IN') return activePlayers;
    if (attendanceFilter === 'OUT') return outPlayers;
    return match.players;
  }, [match, attendanceFilter, activePlayers, outPlayers]);

  // Handle Copy share link
  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Handle Add/Edit Player
  const handleSavePlayer = (player: Player) => {
    if (!match) return;

    let updatedList = [...match.players];
    const existsIdx = updatedList.findIndex((p) => p.id === player.id);

    if (existsIdx >= 0) {
      updatedList[existsIdx] = player;
    } else {
      updatedList.push(player);
    }

    saveMatch({
      ...match,
      players: updatedList,
    });
  };

  // Handle Delete Player
  const handleDeletePlayer = (playerId: string) => {
    if (!match) return;
    if (confirm('Bạn có chắc muốn xóa cầu thủ này khỏi danh sách?')) {
      const updatedList = match.players.filter((p) => p.id !== playerId);
      saveMatch({
        ...match,
        players: updatedList,
      });
    }
  };

  // Handle Quick Paste Import
  const handleQuickPaste = (newPlayers: Player[]) => {
    if (!match) return;
    saveMatch({
      ...match,
      players: [...match.players, ...newPlayers],
    });
  };

  // Toggle Player status IN/OUT directly
  const handleToggleStatus = (player: Player) => {
    if (!match) return;
    const nextStatus: 'IN' | 'OUT' = player.status === 'IN' ? 'OUT' : 'IN';
    const updated: Player[] = match.players.map((p) =>
      p.id === player.id ? { ...p, status: nextStatus } : p
    );
    saveMatch({
      ...match,
      players: updated,
    });
  };

  // Self Check-In action
  const handleSelfCheckIn = (status: 'IN' | 'OUT') => {
    if (!match || !selfCheckInName.trim()) return;

    const trimmed = selfCheckInName.trim();
    // Check if player with this name already exists (case-insensitive)
    const existing = match.players.find(
      (p) => p.name.toLowerCase() === trimmed.toLowerCase()
    );

    let updatedList = [...match.players];
    if (existing) {
      updatedList = updatedList.map((p) =>
        p.id === existing.id ? { ...p, status } : p
      );
    } else {
      updatedList.push({
        id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: trimmed,
        position: 'MID',
        rating: 7,
        status,
        isGuest: true,
        matchesPlayed: 1,
        goals: 0,
        assists: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        mvpCount: 0,
      });
    }

    saveMatch({
      ...match,
      players: updatedList,
    });

    setSelfCheckInName('');
    setShowSelfCheckIn(false);
  };

  // Execute Auto Team Balancing
  const handleDrawTeams = (randomize: boolean = true) => {
    if (!match) return;

    if (activePlayers.length < 2) {
      alert('Cần ít nhất 2 cầu thủ tham gia (status IN) để tiến hành chia đội!');
      return;
    }

    const balancedTeams = balanceTeams(
      activePlayers,
      match.numberOfTeams,
      { randomizeTies: randomize }
    );

    saveMatch({
      ...match,
      teams: balancedTeams,
      isDrawn: true,
    });

    // Celebratory confetti burst
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899'],
      });
    } catch {
      // ignore
    }
  };

  // Handle Player Swap
  const handleSelectPlayerForSwap = (player: Player) => {
    if (!match) return;

    if (!selectedPlayerForSwap) {
      setSelectedPlayerForSwap(player);
    } else {
      if (selectedPlayerForSwap.id === player.id) {
        setSelectedPlayerForSwap(null);
        return;
      }

      // Perform swap
      const updatedTeams = swapPlayersBetweenTeams(
        match.teams,
        selectedPlayerForSwap.id,
        player.id
      );

      saveMatch({
        ...match,
        teams: updatedTeams,
      });

      setSelectedPlayerForSwap(null);
    }
  };

  // Copy formatted Zalo message
  const handleCopyZaloText = () => {
    if (!match) return;
    const text = formatZaloTextMessage(match);
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  // Download image PNG
  const handleDownloadImage = async () => {
    if (!match) return;
    setIsExportingImage(true);
    const success = await downloadPitchAsPng(
      'pitch-export-container',
      `doi-hinh-${match.title.toLowerCase().replace(/\s+/g, '-')}`
    );
    setIsExportingImage(false);
    if (!success) {
      alert('Không thể tạo ảnh. Vui lòng thử lại!');
    }
  };

  if (!match) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 animate-pulse">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Đang tải thông tin phòng trận đấu...</h2>
          <p className="text-sm text-zinc-400 max-w-sm">
            Hệ thống đang kết nối dữ liệu. Vui lòng chờ vài giây hoặc kiểm tra lại đường link.
          </p>
        </div>
      </div>
    );
  }

  const attendanceTarget = match.targetPlayers || 14;
  const isEnoughPlayers = activePlayers.length >= attendanceTarget;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col selection:bg-emerald-500 selection:text-zinc-950">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-6 w-full flex-1 space-y-6">
        {/* Match Header Card */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
                  {match.format}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-xs font-medium">
                  Mã phòng: <code className="font-mono text-emerald-400">{match.id}</code>
                </span>
                {isCloudEnabled ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-400 border border-teal-500/30 text-[11px] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
                    Cloud Realtime
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-zinc-800/80 text-zinc-400 text-[11px]">
                    Đồng bộ cục bộ & Tab
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {match.title}
              </h1>

              {/* Match Meta (Date, Time, Venue) */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-2.5 text-xs sm:text-sm text-zinc-400">
                {match.date && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <span>{match.date}</span>
                  </div>
                )}
                {match.time && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span>{match.time}</span>
                  </div>
                )}
                {match.venue && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span>{match.venue}</span>
                  </div>
                )}
              </div>

              {match.notes && (
                <p className="mt-2 text-xs text-zinc-400 bg-zinc-950/60 p-2 rounded-lg border border-zinc-800 inline-block">
                  💬 Ghi chú: {match.notes}
                </p>
              )}
            </div>

            {/* Actions: Copy Link to Zalo */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                onClick={handleCopyLink}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all shadow-lg active:scale-95 ${
                  copiedLink
                    ? 'bg-emerald-500 text-zinc-950'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                }`}
              >
                {copiedLink ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Share2 className="w-4 h-4" />}
                <span>{copiedLink ? 'Đã sao chép link!' : 'Copy link gửi Zalo'}</span>
              </button>
            </div>
          </div>

          {/* Attendance Progress Bar */}
          <div className="mt-5 pt-4 border-t border-zinc-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-200">Tiến độ điểm danh:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-md ${
                    isEnoughPlayers
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {activePlayers.length} / {attendanceTarget} cầu thủ
                </span>
                {outPlayers.length > 0 && (
                  <span className="text-rose-400 text-xs">({outPlayers.length} báo bận)</span>
                )}
              </div>
              <span className="text-zinc-400 text-[11px]">
                {activePlayers.length >= attendanceTarget
                  ? '🎉 Đã đủ quân số đá!'
                  : `Cần thêm ${attendanceTarget - activePlayers.length} người`}
              </span>
            </div>

            {/* Progress track */}
            <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-800">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isEnoughPlayers ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-emerald-400'
                }`}
                style={{
                  width: `${Math.min(100, (activePlayers.length / attendanceTarget) * 100)}%`,
                }}
              />
            </div>
          </div>
        </section>

        {/* Self Check-in Banner for Quick RSVP */}
        <section className="bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Bạn tham gia trận này chứ?</h3>
              <p className="text-xs text-zinc-400">
                Bấm vào tên bạn bên dưới, hoặc nhập tên nhanh để xác nhận tham gia
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {showSelfCheckIn ? (
              <div className="flex items-center gap-2 w-full sm:w-auto animate-in fade-in">
                <input
                  type="text"
                  value={selfCheckInName}
                  onChange={(e) => setSelfCheckInName(e.target.value)}
                  placeholder="Nhập tên của bạn..."
                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => handleSelfCheckIn('IN')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all"
                >
                  Tham gia
                </button>
                <button
                  onClick={() => handleSelfCheckIn('OUT')}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-semibold"
                >
                  Bận
                </button>
                <button
                  onClick={() => setShowSelfCheckIn(false)}
                  className="p-1.5 text-zinc-500 hover:text-white"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSelfCheckIn(true)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all active:scale-95"
              >
                ⚡ Tự điểm danh nhanh
              </button>
            )}
          </div>
        </section>

        {/* Main Content Grid: Left (Player Roster) & Right (Draw & Team Results) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Player Management & Attendance (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-base text-white">Danh sách điểm danh</h3>
                </div>
                <span className="text-xs text-zinc-400">
                  Tổng: <strong className="text-white">{match.players.length}</strong>
                </span>
              </div>

              {/* Action Buttons: Add Player & Paste Zalo */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => {
                    setEditingPlayer(null);
                    setIsAddPlayerOpen(true);
                  }}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold border border-zinc-700/80 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>+ Thêm cầu thủ</span>
                </button>

                <button
                  onClick={() => setIsQuickPasteOpen(true)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold border border-zinc-700/80 transition-colors"
                >
                  <ClipboardList className="w-3.5 h-3.5 text-teal-400" />
                  <span>📋 Dán từ Zalo</span>
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 p-1 bg-zinc-950 rounded-xl border border-zinc-800 mb-3 text-xs">
                <button
                  onClick={() => setAttendanceFilter('ALL')}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
                    attendanceFilter === 'ALL'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Tất cả ({match.players.length})
                </button>
                <button
                  onClick={() => setAttendanceFilter('IN')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors ${
                    attendanceFilter === 'IN'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-zinc-400 hover:text-emerald-400'
                  }`}
                >
                  Đi ({activePlayers.length})
                </button>
                <button
                  onClick={() => setAttendanceFilter('OUT')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors ${
                    attendanceFilter === 'OUT'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'text-zinc-400 hover:text-rose-400'
                  }`}
                >
                  Vắng ({outPlayers.length})
                </button>
              </div>

              {/* Player list */}
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                {filteredPlayers.length === 0 ? (
                  <div className="text-center py-10 text-zinc-500 text-xs">
                    Chưa có cầu thủ nào trong danh sách này.
                  </div>
                ) : (
                  filteredPlayers.map((player, idx) => {
                    const posInfo = POSITION_LABELS[player.position];
                    const isIn = player.status === 'IN';

                    return (
                      <div
                        key={player.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                          isIn
                            ? 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700'
                            : 'bg-zinc-950/40 border-zinc-900 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Toggle In/Out Button */}
                          <button
                            onClick={() => handleToggleStatus(player)}
                            title={isIn ? 'Bấm để báo vắng' : 'Bấm để báo tham gia'}
                            className={`p-1 rounded-lg transition-transform active:scale-90 ${
                              isIn
                                ? 'text-emerald-400 hover:bg-emerald-500/10'
                                : 'text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10'
                            }`}
                          >
                            {isIn ? (
                              <CheckCircle2 className="w-5 h-5 fill-emerald-500/20" />
                            ) : (
                              <XCircle className="w-5 h-5" />
                            )}
                          </button>

                          {/* Position Badge */}
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${posInfo.badgeClass}`}
                          >
                            {player.position}
                          </span>

                          {/* Player Name */}
                          <div className="truncate">
                            <span className="text-sm font-semibold text-white block truncate">
                              {player.name}
                            </span>
                          </div>
                        </div>

                        {/* Rating & Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs font-semibold text-amber-400 flex items-center gap-0.5 mr-1">
                            <Star className="w-3 h-3 fill-amber-400" />
                            <span>{player.rating}</span>
                          </span>

                          <button
                            onClick={() => {
                              setEditingPlayer(player);
                              setIsAddPlayerOpen(true);
                            }}
                            className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                            title="Sửa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePlayer(player.id)}
                            className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-800"
                            title="Xóa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Balancing Engine & Squad Results (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Draw Controls Banner */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                <div>
                  <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    <span>Thuật toán chia đội thông minh</span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Cân bằng thủ môn, dàn trải vị trí và tối ưu độ chênh lệch điểm số
                  </p>
                </div>

                {/* Team Number Selector */}
                <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
                  <span className="text-zinc-400 px-2 font-medium">Chia làm:</span>
                  {([2, 3, 4] as const).map((num) => (
                    <button
                      key={num}
                      onClick={() =>
                        saveMatch({
                          ...match,
                          numberOfTeams: num,
                        })
                      }
                      className={`px-3 py-1 rounded-lg font-bold transition-all ${
                        match.numberOfTeams === num
                          ? 'bg-emerald-500 text-zinc-950 shadow-md'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {num} đội
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons: DRAW / RE-ROLL */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={() => handleDrawTeams(true)}
                  disabled={activePlayers.length < 2}
                  className="flex-1 flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-50 text-zinc-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-emerald-500/25 transition-all transform active:scale-98 cursor-pointer"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>⚡ Chia Đội Tự Động</span>
                </button>

                {match.isDrawn && (
                  <button
                    onClick={() => handleDrawTeams(true)}
                    className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs border border-zinc-700 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 text-emerald-400" />
                    <span>Xáo lại (Re-roll)</span>
                  </button>
                )}
              </div>

              {/* Swap Helper Notice */}
              {selectedPlayerForSwap && (
                <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between animate-pulse">
                  <span>
                    🔄 Đang chọn: <strong>{selectedPlayerForSwap.name}</strong>. Hãy bấm vào một cầu thủ ở đội khác để đổi chỗ!
                  </span>
                  <button
                    onClick={() => setSelectedPlayerForSwap(null)}
                    className="text-xs underline text-amber-400"
                  >
                    Hủy
                  </button>
                </div>
              )}
            </div>

            {/* Results Section */}
            {match.isDrawn && match.teams && match.teams.length > 0 ? (
              <div className="space-y-4">
                {/* View Switcher & Export Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Tabs: Sa bàn sân cỏ vs Thẻ danh sách */}
                  <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-2xl border border-zinc-800 text-xs">
                    <button
                      onClick={() => setActiveTab('pitch')}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all ${
                        activeTab === 'pitch'
                          ? 'bg-emerald-500 text-zinc-950 shadow-md'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                      <span>Sa bàn sân cỏ</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('cards')}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all ${
                        activeTab === 'cards'
                          ? 'bg-emerald-500 text-zinc-950 shadow-md'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Shield className="w-4 h-4" />
                      <span>Thẻ các đội</span>
                    </button>
                  </div>

                  {/* Export Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyZaloText}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        copiedText
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                      }`}
                    >
                      {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedText ? 'Đã copy text Zalo!' : 'Copy Text Zalo'}</span>
                    </button>

                    <button
                      onClick={handleDownloadImage}
                      disabled={isExportingImage}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-md shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{isExportingImage ? 'Đang tạo ảnh...' : 'Tải ảnh PNG'}</span>
                    </button>
                  </div>
                </div>

                {/* Tab 1: Realistic Pitch View */}
                {activeTab === 'pitch' && (
                  <FootballPitchView
                    teams={match.teams}
                    matchTitle={match.title}
                    matchInfo={`${match.date ? `${match.date} • ` : ''}${match.time || ''}${match.venue ? ` • ${match.venue}` : ''}`}
                  />
                )}

                {/* Tab 2: Interactive Squad Cards */}
                {activeTab === 'cards' && (
                  <div className={`grid grid-cols-1 ${match.teams.length > 2 ? 'md:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}>
                    {match.teams.map((team) => (
                      <TeamCard
                        key={team.id}
                        team={team}
                        selectedPlayerForSwap={selectedPlayerForSwap}
                        onSelectPlayerForSwap={handleSelectPlayerForSwap}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/50 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700 mx-auto flex items-center justify-center text-2xl">
                  ⚽
                </div>
                <h4 className="font-bold text-white text-base">Chưa chia đội</h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                  Hiện đang có <strong className="text-emerald-400">{activePlayers.length} cầu thủ</strong> xác nhận tham gia. Hãy bấm nút <span className="text-white font-semibold">&quot;Chia Đội Tự Động&quot;</span> ở trên để tạo sa bàn thi đấu!
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <AddPlayerModal
        isOpen={isAddPlayerOpen}
        onClose={() => {
          setIsAddPlayerOpen(false);
          setEditingPlayer(null);
        }}
        onAdd={handleSavePlayer}
        initialPlayer={editingPlayer}
      />

      <QuickPasteModal
        isOpen={isQuickPasteOpen}
        onClose={() => setIsQuickPasteOpen(false)}
        onImport={handleQuickPaste}
      />
    </div>
  );
}
