'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import FootballPitchView from '@/components/FootballPitchView';
import TeamCard from '@/components/TeamCard';
import AddPlayerModal from '@/components/AddPlayerModal';
import QuickPasteModal from '@/components/QuickPasteModal';
import { Player, Team, Match, AttendancePoll, POSITION_LABELS } from '@/types/football';
import { balanceTeams, swapPlayersBetweenTeams } from '@/lib/balance';
import { downloadPitchAsPng, formatZaloTextMessage } from '@/lib/export';
import { useAdminAuth } from '@/context/AdminAuthContext';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Users,
  RefreshCw,
  Copy,
  Check,
  Download,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  Shield,
  Layers,
  ClipboardList,
  UserPlus,
  ArrowLeftRight,
  CheckCircle2,
  Trash2,
  Edit2,
  Star,
  Trophy,
  Lock,
  Unlock,
  KeyRound,
} from 'lucide-react';

export default function DrawPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DrawContent />
    </Suspense>
  );
}

function DrawContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pollId = searchParams.get('pollId');
  const { isAdmin, openPasswordModal } = useAdminAuth();

  // Match / Draw Info
  const [title, setTitle] = useState('Nội chiến FC Anh Em');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('20:00 - 21:30');
  const [venue, setVenue] = useState('Sân bóng Chuyên Việt (Quận 7)');
  const [format, setFormat] = useState<'5v5' | '7v7' | '11v11'>('7v7');
  const [numberOfTeams, setNumberOfTeams] = useState<2 | 3 | 4>(2);
  const [notes, setNotes] = useState('Áo Cam & Xanh dương');

  // Player pool
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isDrawn, setIsDrawn] = useState(false);
  const [selectedPlayerForSwap, setSelectedPlayerForSwap] = useState<Player | null>(null);

  // Poll source notice
  const [sourcePoll, setSourcePoll] = useState<AttendancePoll | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<'pitch' | 'cards'>('pitch');
  const [copiedText, setCopiedText] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [isSavingMatch, setIsSavingMatch] = useState(false);

  // Modals
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [isQuickPasteOpen, setIsQuickPasteOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Load initial players (From Poll if query present, or from Roster API)
  useEffect(() => {
    const today = new Date();
    setDate(today.toISOString().split('T')[0]);

    if (pollId) {
      // Fetch Poll
      fetch(`/api/polls/${pollId}`)
        .then((res) => res.json())
        .then((poll: AttendancePoll) => {
          if (poll && poll.id) {
            setSourcePoll(poll);
            setTitle(poll.title);
            if (poll.date) setDate(poll.date);
            if (poll.time) setTime(poll.time);
            if (poll.venue) setVenue(poll.venue);
            if (poll.format) setFormat(poll.format);
            if (poll.notes) setNotes(poll.notes);

            // Filter ONLY 'YES' voters
            const yesVotes = poll.votes.filter((v) => v.status === 'YES');
            const pollPlayers: Player[] = yesVotes.map((v, idx) => ({
              id: v.playerId || `p_${Date.now()}_${idx}`,
              name: v.playerName,
              position: v.position || 'MID',
              rating: v.rating || 7,
              matchesPlayed: 1,
              goals: 0,
              assists: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              mvpCount: 0,
              status: 'IN',
            }));

            setPlayers(pollPlayers);
            if (pollPlayers.length >= 2) {
              const balanced = balanceTeams(pollPlayers, numberOfTeams);
              setTeams(balanced);
              setIsDrawn(true);
            }
          }
        })
        .catch(() => { });
    } else {
      // Default: load club roster
      fetch('/api/players')
        .then((res) => res.json())
        .then((roster: Player[]) => {
          if (Array.isArray(roster) && roster.length > 0) {
            const initialSelection = roster.slice(0, 14).map((p) => ({ ...p, status: 'IN' as const }));
            setPlayers(initialSelection);
            const balanced = balanceTeams(initialSelection, numberOfTeams);
            setTeams(balanced);
            setIsDrawn(true);
          }
        })
        .catch(() => { });
    }
  }, [pollId, numberOfTeams]);

  // Active players
  const activePlayers = useMemo(() => {
    return players.filter((p) => p.status === 'IN');
  }, [players]);

  // Execute Auto Team Balancing
  const handleDrawTeams = (randomize: boolean = true) => {
    if (activePlayers.length < 2) {
      alert('Cần ít nhất 2 cầu thủ tham gia (status IN) để chia đội!');
      return;
    }

    const balanced = balanceTeams(activePlayers, numberOfTeams, { randomizeTies: randomize });
    setTeams(balanced);
    setIsDrawn(true);

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

  // Toggle active player IN/OUT
  const handleTogglePlayerStatus = (playerId: string) => {
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === playerId ? { ...p, status: p.status === 'IN' ? 'OUT' : 'IN' } : p
      )
    );
  };

  // Player Swap
  const handleSelectPlayerForSwap = (player: Player) => {
    if (!selectedPlayerForSwap) {
      setSelectedPlayerForSwap(player);
    } else {
      if (selectedPlayerForSwap.id === player.id) {
        setSelectedPlayerForSwap(null);
        return;
      }

      const updated = swapPlayersBetweenTeams(teams, selectedPlayerForSwap.id, player.id);
      setTeams(updated);
      setSelectedPlayerForSwap(null);
    }
  };

  // Add / Edit Player
  const handleSavePlayer = (player: Player) => {
    setPlayers((prev) => {
      const idx = prev.findIndex((p) => p.id === player.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = player;
        return copy;
      }
      return [...prev, player];
    });
  };

  // Quick Paste
  const handleQuickPaste = (newPlayers: Player[]) => {
    setPlayers((prev) => [...prev, ...newPlayers]);
  };

  // Delete Player
  const handleDeletePlayer = (playerId: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== playerId));
  };

  // Copy text for Zalo
  const handleCopyZalo = () => {
    const dummyMatch: Match = {
      id: 'draw-preview',
      title,
      date,
      time,
      venue,
      format,
      targetPlayers: players.length,
      numberOfTeams,
      status: 'SCHEDULED',
      players,
      teams,
      isDrawn,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const text = formatZaloTextMessage(dummyMatch);
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  // Download image PNG
  const handleDownloadImage = async () => {
    setIsExportingImage(true);
    const success = await downloadPitchAsPng(
      'pitch-export-container',
      `doi-hinh-${title.toLowerCase().replace(/\s+/g, '-')}`
    );
    setIsExportingImage(false);
    if (!success) {
      alert('Không thể tạo ảnh. Vui lòng thử lại!');
    }
  };

  // Create official match from this Draw
  const handleCreateMatchFromDraw = async () => {
    if (!isDrawn || teams.length === 0) {
      alert('Vui lòng chia đội trước khi tạo trận đấu!');
      return;
    }

    setIsSavingMatch(true);
    try {
      const matchId = `match_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
      const newMatch: Match = {
        id: matchId,
        title: title.trim(),
        date,
        time: time.trim(),
        venue: venue.trim(),
        format,
        targetPlayers: activePlayers.length,
        numberOfTeams,
        notes: notes.trim(),
        status: 'SCHEDULED',
        players: activePlayers,
        teams,
        isDrawn: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMatch),
      });

      if (res.ok) {
        router.push('/matches');
      } else {
        throw new Error('Lỗi khi lưu trận đấu');
      }
    } catch {
      alert('Không thể lưu trận đấu. Vui lòng thử lại!');
    } finally {
      setIsSavingMatch(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col selection:bg-emerald-500 selection:text-zinc-950">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 w-full flex-1 space-y-6">
        {/* Member Mode Notice Banner */}
        {!isAdmin && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 font-semibold flex items-center gap-1.5 shrink-0">
                <Lock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Chế độ Xem (Thành viên)</span>
              </span>
              <span className="text-zinc-400">
                Để chia đội, xáo quân số hoặc hoán đổi vị trí cầu thủ, vui lòng đăng nhập quyền Đội trưởng.
              </span>
            </div>

            <button
              onClick={openPasswordModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition-all shadow-md shrink-0 cursor-pointer text-xs"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Đội trưởng đăng nhập</span>
            </button>
          </div>
        )}

        {/* Source Poll Notice if loaded from Poll */}
        {sourcePoll && (
          <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-xs">
            <div className="flex items-center gap-2 text-emerald-400">
              <ClipboardList className="w-4 h-4" />
              <span>
                Đang chia đội từ đợt điểm danh: <strong>{sourcePoll.title}</strong> ({activePlayers.length} cầu thủ có mặt)
              </span>
            </div>
            <button
              onClick={() => router.push(`/poll/${sourcePoll.id}`)}
              className="text-zinc-400 hover:text-white underline"
            >
              Xem lại Poll
            </button>
          </div>
        )}

        {/* Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
                FootDraw Balancer
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <Sparkles className="w-7 h-7 text-emerald-400" />
              <span>Chia Đội Cân Bằng (Draw)</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Thuật toán tự động dàn đều thủ môn, phân bổ các tuyến và triệt tiêu độ lệch trình độ rating giữa các đội.
            </p>
          </div>

              {isAdmin ? (
            <div className="flex flex-wrap items-center gap-2">
              {/* Number of Teams Selector */}
              <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
                <span className="text-zinc-400 px-2 font-medium">Chia làm:</span>
                {([2, 3, 4] as const).map((num) => (
                  <button
                    key={num}
                    onClick={() => setNumberOfTeams(num)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      numberOfTeams === num
                        ? 'bg-emerald-500 text-zinc-950 shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {num} đội
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleDrawTeams(true)}
                disabled={activePlayers.length < 2}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-50 text-zinc-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>⚡ Chia Đội Tự Động</span>
              </button>
            </div>
            ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={openPasswordModal}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Mở quyền Chia Đội</span>
              </button>
            </div>
          )}
          </div>

          {/* Main Grid: Left Roster Selection (4 Cols) & Right Results (8 Cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Player Pool (4 Cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-base text-white">Danh sách cầu thủ</h3>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">
                    {activePlayers.length} / {players.length} chọn đá
                  </span>
                </div>

                  {/* Action buttons (Admin only) */}
                  {isAdmin && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    onClick={() => {
                      setEditingPlayer(null);
                      setIsAddPlayerOpen(true);
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold border border-zinc-700/80 transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>+ Thêm cầu thủ</span>
                  </button>

                  <button
                    onClick={() => setIsQuickPasteOpen(true)}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold border border-zinc-700/80 transition-colors"
                  >
                    <ClipboardList className="w-3.5 h-3.5 text-teal-400" />
                    <span>📋 Dán từ Zalo</span>
                  </button>
                </div>
              )}

                {/* Player list */}
                <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
                  {players.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500 text-xs">
                      Chưa có cầu thủ nào trong danh sách. Bấm &quot;+ Thêm cầu thủ&quot; hoặc &quot;Dán từ Zalo&quot; để thêm!
                    </div>
                  ) : (
                    players.map((player) => {
                      const posInfo = POSITION_LABELS[player.position];
                      const isIn = player.status === 'IN';

                      return (
                        <div
                          key={player.id}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${isIn
                              ? 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700'
                              : 'bg-zinc-950/30 border-zinc-900 opacity-50'
                            }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              onClick={() => handleTogglePlayerStatus(player.id)}
                              className={`p-1 rounded-lg transition-transform active:scale-90 ${isIn ? 'text-emerald-400' : 'text-zinc-600 hover:text-white'
                                }`}
                            >
                              <CheckCircle2
                                className={`w-4 h-4 ${isIn ? 'fill-emerald-500/20' : ''}`}
                              />
                            </button>

                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${posInfo.badgeClass}`}
                            >
                              {player.position}
                            </span>

                            <span className="text-xs font-semibold text-white truncate block">
                              {player.name}
                            </span>
                          </div>

                              {isAdmin ? (
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-xs font-semibold text-amber-400 flex items-center gap-0.5">
                                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                                    <span>{player.rating}</span>
                                  </span>

                                  <button
                                    onClick={() => {
                                      setEditingPlayer(player);
                                      setIsAddPlayerOpen(true);
                                    }}
                                    className="p-1 rounded text-zinc-500 hover:text-white"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeletePlayer(player.id)}
                                    className="p-1 rounded text-zinc-500 hover:text-rose-400"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                          <span className="text-[11px] text-zinc-500 font-medium shrink-0">
                            {isIn ? 'Đi đá' : 'Vắng'}
                          </span>
                        )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Squad Results & Pitch View (8 Cols) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Swap helper notice */}
              {selectedPlayerForSwap && (
                <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between animate-pulse">
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

              {isDrawn && teams.length > 0 ? (
                <div className="space-y-4">
                  {/* View Switcher & Export Toolbar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-3 rounded-2xl">
                    {/* Tabs: Sa bàn sân cỏ vs Thẻ danh sách */}
                    <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
                      <button
                        onClick={() => setActiveTab('pitch')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${activeTab === 'pitch'
                            ? 'bg-emerald-500 text-zinc-950 shadow-md'
                            : 'text-zinc-400 hover:text-white'
                          }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Sa bàn sân cỏ</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('cards')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${activeTab === 'cards'
                            ? 'bg-emerald-500 text-zinc-950 shadow-md'
                            : 'text-zinc-400 hover:text-white'
                          }`}
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>Thẻ các đội</span>
                      </button>
                    </div>

                    {/* Export Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyZalo}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${copiedText
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                          }`}
                      >
                        {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedText ? 'Đã copy Zalo!' : 'Copy Text Zalo'}</span>
                      </button>

                      <button
                        onClick={handleDownloadImage}
                        disabled={isExportingImage}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-md shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
                      >
                        <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>{isExportingImage ? 'Đang tạo ảnh...' : 'Tải ảnh PNG'}</span>
                      </button>

                      {isAdmin && (
                        <button
                          onClick={handleCreateMatchFromDraw}
                          disabled={isSavingMatch}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer"
                        >
                          <Trophy className="w-3.5 h-3.5" />
                          <span>{isSavingMatch ? 'Đang tạo...' : 'Lưu thành trận đấu'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tab 1: Realistic Pitch View */}
                  {activeTab === 'pitch' && (
                    <FootballPitchView
                      teams={teams}
                      matchTitle={title}
                      matchInfo={`${date ? `${date} • ` : ''}${time || ''}${venue ? ` • ${venue}` : ''}`}
                      hideRating={!isAdmin}
                    />
                  )}

                  {/* Tab 2: Interactive Squad Cards */}
                  {activeTab === 'cards' && (
                    <div className={`grid grid-cols-1 ${teams.length > 2 ? 'md:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}>
                      {teams.map((team) => (
                        <TeamCard
                          key={team.id}
                          team={team}
                          selectedPlayerForSwap={isAdmin ? selectedPlayerForSwap : null}
                          onSelectPlayerForSwap={isAdmin ? handleSelectPlayerForSwap : undefined}
                          isMemberView={!isAdmin}
                          hideRating={!isAdmin}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-16 text-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/40 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 mx-auto flex items-center justify-center text-2xl">
                    ⚽
                  </div>
                  <h4 className="font-bold text-white text-base">Chưa chia đội</h4>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                    Hiện đang có <strong className="text-emerald-400">{activePlayers.length} cầu thủ</strong> được chọn. Hãy bấm nút <span className="text-white font-semibold">&quot;⚡ Chia Đội Tự Động&quot;</span> ở góc trên để tạo sa bàn đội hình!
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

