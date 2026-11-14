'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import CreateMatchModal from '@/components/CreateMatchModal';
import { useClubStore } from '@/lib/club-store';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Match, GoalEvent, AssistEvent } from '@/types/football';
import {
  Calendar,
  Clock,
  MapPin,
  Trophy,
  Users,
  Plus,
  ArrowRight,
  CheckCircle2,
  Medal,
  Check,
  X,
  Edit3,
  Lock,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { isAdmin, openPasswordModal } = useAdminAuth();
  const { matches, roster, recordMatchResult, upsertMatch } = useClubStore();
  const [filter, setFilter] = useState<'ALL' | 'UPCOMING' | 'COMPLETED'>('ALL');
  const [recordingMatch, setRecordingMatch] = useState<Match | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Score record modal states
  const [team1Score, setTeam1Score] = useState<number>(0);
  const [team2Score, setTeam2Score] = useState<number>(0);
  const [goalEvents, setGoalEvents] = useState<GoalEvent[]>([]);
  const [assistEvents, setAssistEvents] = useState<AssistEvent[]>([]);
  const [mvpPlayerId, setMvpPlayerId] = useState<string>('');
  const [selectedScorerId, setSelectedScorerId] = useState<string>('');
  const [selectedScorerTeam, setSelectedScorerTeam] = useState<number>(1);
  const [scorerGoalCount, setScorerGoalCount] = useState<number>(1);
  const [selectedAssisterId, setSelectedAssisterId] = useState<string>('');
  const [selectedAssisterTeam, setSelectedAssisterTeam] = useState<number>(1);
  const [assisterCount, setAssisterCount] = useState<number>(1);

  const filteredMatches = matches.filter((m) => {
    if (filter === 'UPCOMING') return m.status !== 'COMPLETED';
    if (filter === 'COMPLETED') return m.status === 'COMPLETED';
    return true;
  });

  const handleOpenRecordModal = (match: Match) => {
    setRecordingMatch(match);
    const gEvents = match.goalEvents || [];
    const gTeam1 = gEvents.filter((g) => g.teamId === 1).length;
    const gTeam2 = gEvents.filter((g) => g.teamId === 2).length;
    setTeam1Score(match.score?.team1 !== undefined ? match.score.team1 : gTeam1);
    setTeam2Score(match.score?.team2 !== undefined ? match.score.team2 : gTeam2);
    setGoalEvents(gEvents);
    setAssistEvents(match.assistEvents || []);
    setMvpPlayerId(match.mvpPlayerId || '');
    setSelectedScorerId('');
    setSelectedScorerTeam(1);
    setSelectedAssisterId('');
    setSelectedAssisterTeam(1);
    setScorerGoalCount(1);
    setAssisterCount(1);
  };

  const handleSelectScorer = (playerId: string) => {
    setSelectedScorerId(playerId);
    if (recordingMatch?.teams) {
      if (recordingMatch.teams[0]?.players.some((p) => p.id === playerId)) {
        setSelectedScorerTeam(1);
      } else if (recordingMatch.teams[1]?.players.some((p) => p.id === playerId)) {
        setSelectedScorerTeam(2);
      } else if (recordingMatch.teams[2]?.players.some((p) => p.id === playerId)) {
        setSelectedScorerTeam(3);
      }
    }
  };

  const handleAddGoal = (count: number = scorerGoalCount) => {
    if (!selectedScorerId || count <= 0) return;
    const player = roster.find((p) => p.id === selectedScorerId);
    if (!player) return;

    const newEvents: GoalEvent[] = Array.from({ length: count }, () => ({
      id: `g_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      playerId: player.id,
      playerName: player.name,
      teamId: selectedScorerTeam,
    }));

    setGoalEvents((prev) => [...prev, ...newEvents]);

    // Automatically update team score
    if (selectedScorerTeam === 1) setTeam1Score((prev) => prev + count);
    if (selectedScorerTeam === 2) setTeam2Score((prev) => prev + count);

    setScorerGoalCount(1);
  };

  const handlePlayerGoalAdjust = (playerId: string, teamId: number, delta: number) => {
    if (delta > 0) {
      const player = roster.find((p) => p.id === playerId);
      if (!player) return;
      const newEvent: GoalEvent = {
        id: `g_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        playerId: player.id,
        playerName: player.name,
        teamId,
      };
      setGoalEvents((prev) => [...prev, newEvent]);
      if (teamId === 1) setTeam1Score((prev) => prev + 1);
      if (teamId === 2) setTeam2Score((prev) => prev + 1);
    } else if (delta < 0) {
      const idx = goalEvents.findIndex((g) => g.playerId === playerId && g.teamId === teamId);
      if (idx >= 0) {
        setGoalEvents((prev) => prev.filter((_, i) => i !== idx));
        if (teamId === 1 && team1Score > 0) setTeam1Score((prev) => prev - 1);
        if (teamId === 2 && team2Score > 0) setTeam2Score((prev) => prev - 1);
      }
    }
  };

  const handleRemoveAllGoalsForPlayer = (playerId: string, teamId: number) => {
    const countToRemove = goalEvents.filter((g) => g.playerId === playerId && g.teamId === teamId).length;
    setGoalEvents((prev) => prev.filter((g) => !(g.playerId === playerId && g.teamId === teamId)));
    if (teamId === 1) setTeam1Score((prev) => Math.max(0, prev - countToRemove));
    if (teamId === 2) setTeam2Score((prev) => Math.max(0, prev - countToRemove));
  };

  const groupedGoals = useMemo(() => {
    const map = new Map<string, { playerId: string; playerName: string; teamId: number; count: number }>();
    for (const g of goalEvents) {
      const key = `${g.playerId}_${g.teamId}`;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, { playerId: g.playerId, playerName: g.playerName, teamId: g.teamId, count: 1 });
      }
    }
    return Array.from(map.values());
  }, [goalEvents]);

  const handleSelectAssister = (playerId: string) => {
    setSelectedAssisterId(playerId);
    if (recordingMatch?.teams) {
      if (recordingMatch.teams[0]?.players.some((p) => p.id === playerId)) {
        setSelectedAssisterTeam(1);
      } else if (recordingMatch.teams[1]?.players.some((p) => p.id === playerId)) {
        setSelectedAssisterTeam(2);
      } else if (recordingMatch.teams[2]?.players.some((p) => p.id === playerId)) {
        setSelectedAssisterTeam(3);
      }
    }
  };

  const handleAddAssist = (count: number = assisterCount) => {
    if (!selectedAssisterId || count <= 0) return;
    const player = roster.find((p) => p.id === selectedAssisterId);
    if (!player) return;

    const newEvents: AssistEvent[] = Array.from({ length: count }, () => ({
      id: `a_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      playerId: player.id,
      playerName: player.name,
      teamId: selectedAssisterTeam,
    }));

    setAssistEvents((prev) => [...prev, ...newEvents]);
    setAssisterCount(1);
  };

  const handlePlayerAssistAdjust = (playerId: string, teamId: number, delta: number) => {
    if (delta > 0) {
      const player = roster.find((p) => p.id === playerId);
      if (!player) return;
      const newEvent: AssistEvent = {
        id: `a_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        playerId: player.id,
        playerName: player.name,
        teamId,
      };
      setAssistEvents((prev) => [...prev, newEvent]);
    } else if (delta < 0) {
      const idx = assistEvents.findIndex((a) => a.playerId === playerId && a.teamId === teamId);
      if (idx >= 0) {
        setAssistEvents((prev) => prev.filter((_, i) => i !== idx));
      }
    }
  };

  const handleRemoveAllAssistsForPlayer = (playerId: string, teamId: number) => {
    setAssistEvents((prev) => prev.filter((a) => !(a.playerId === playerId && a.teamId === teamId)));
  };

  const groupedAssists = useMemo(() => {
    const map = new Map<string, { playerId: string; playerName: string; teamId: number; count: number }>();
    for (const a of assistEvents) {
      const key = `${a.playerId}_${a.teamId}`;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, { playerId: a.playerId, playerName: a.playerName, teamId: a.teamId, count: 1 });
      }
    }
    return Array.from(map.values());
  }, [assistEvents]);

  const handleSaveResult = () => {
    if (!recordingMatch) return;

    recordMatchResult(recordingMatch.id, {
      score: { team1: team1Score, team2: team2Score },
      goalEvents,
      assistEvents,
      mvpPlayerId: mvpPlayerId || undefined,
    });

    setRecordingMatch(null);
  };

  const handleCreateMatchSuccess = (newMatch: Match) => {
    upsertMatch(newMatch);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col selection:bg-emerald-500 selection:text-zinc-950">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 w-full flex-1 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-emerald-400" />
              <h1 className="text-2xl font-black text-white tracking-tight">Danh sách các trận đấu</h1>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Bấm vào trận đấu để vào phòng điểm danh realtime, chia đội cân bằng & sa bàn chiến thuật
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isAdmin ? (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>+ Tạo trận mới</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={openPasswordModal}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-800 transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Đội trưởng đăng nhập</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900 rounded-xl border border-zinc-800 max-w-sm text-xs">
          <button
            onClick={() => setFilter('ALL')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
              filter === 'ALL'
                ? 'bg-emerald-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Tất cả ({matches.length})
          </button>
          <button
            onClick={() => setFilter('UPCOMING')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
              filter === 'UPCOMING'
                ? 'bg-emerald-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Sắp đá ({matches.filter((m) => m.status !== 'COMPLETED').length})
          </button>
          <button
            onClick={() => setFilter('COMPLETED')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
              filter === 'COMPLETED'
                ? 'bg-emerald-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Đã xong ({matches.filter((m) => m.status === 'COMPLETED').length})
          </button>
        </div>

        {/* Matches List */}
        <div className="space-y-4">
          {filteredMatches.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/40 space-y-3">
              <Calendar className="w-10 h-10 text-zinc-600 mx-auto" />
              <p className="text-zinc-400 text-sm">Chưa có trận đấu nào trong danh mục này.</p>
              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Tạo trận đấu ngay</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openPasswordModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-white font-semibold transition-colors cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Mở khóa Admin để tạo trận</span>
                </button>
              )}
            </div>
          ) : (
            filteredMatches.map((m) => {
              const hasScore = m.score !== undefined && m.score !== null;
              const isCompleted = m.status === 'COMPLETED' || hasScore;
              const s1 = m.score?.team1 ?? 0;
              const s2 = m.score?.team2 ?? 0;
              const team1 = m.teams[0];
              const team2 = m.teams[1];
              const mvp = roster.find((p) => p.id === m.mvpPlayerId);

              return (
                <div
                  key={m.id}
                  onClick={() => router.push(`/match/${m.id}`)}
                  className="bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 rounded-3xl p-5 sm:p-6 shadow-xl transition-all space-y-4 cursor-pointer group hover:bg-zinc-900/80"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            isCompleted
                              ? 'bg-zinc-800 text-zinc-300'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {isCompleted ? 'Đã kết thúc' : 'Sắp diễn ra'}
                        </span>
                        <span className="text-xs text-zinc-400 font-mono">
                          {m.format} • {m.players.length} cầu thủ
                        </span>
                      </div>
                      <h3 className="font-extrabold text-base sm:text-lg text-white group-hover:text-emerald-400 transition-colors">
                        {m.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {isAdmin ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenRecordModal(m);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                          <span>{isCompleted ? 'Sửa tỷ số' : 'Nhập tỷ số'}</span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openPasswordModal();
                          }}
                          title="Nhập mật khẩu để mở quyền nhập tỷ số"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-medium border border-zinc-800 transition-colors cursor-pointer"
                        >
                          <Lock className="w-3 h-3 text-zinc-500" />
                          <span>Đội trưởng nhập điểm</span>
                        </button>
                      )}

                      <div className="w-8 h-8 rounded-xl bg-zinc-800 group-hover:bg-emerald-500 group-hover:text-zinc-950 text-zinc-400 flex items-center justify-center transition-all ml-1">
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>

                  {/* Scoreboard Display */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4 bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800/80">
                    {/* Team 1 */}
                    <div className="flex items-center gap-3">
                      <span className="w-3.5 h-3.5 rounded-full bg-orange-500 shadow-md shadow-orange-500/50" />
                      <div>
                        <span className="text-sm font-bold text-white block">
                          {team1 ? team1.name : 'Đội Cam'}
                        </span>
                        <span className="text-xs text-zinc-400">
                          {team1 ? `${team1.players.length} cầu thủ` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Score Center */}
                    <div className="text-center py-1">
                      {hasScore || isCompleted ? (
                        <div className="flex items-center justify-center gap-3 font-mono font-black text-2xl sm:text-3xl text-white">
                          <span className={s1 > s2 ? 'text-emerald-400' : 'text-zinc-300'}>
                            {s1}
                          </span>
                          <span className="text-zinc-600">-</span>
                          <span className={s2 > s1 ? 'text-emerald-400' : 'text-zinc-300'}>
                            {s2}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                          Chưa có tỷ số
                        </span>
                      )}
                    </div>

                    {/* Team 2 */}
                    <div className="flex items-center justify-start sm:justify-end gap-3 text-left sm:text-right">
                      <div>
                        <span className="text-sm font-bold text-white block">
                          {team2 ? team2.name : 'Đội Xanh'}
                        </span>
                        <span className="text-xs text-zinc-400">
                          {team2 ? `${team2.players.length} cầu thủ` : ''}
                        </span>
                      </div>
                      <span className="w-3.5 h-3.5 rounded-full bg-blue-600 shadow-md shadow-blue-500/50" />
                    </div>
                  </div>

                  {/* Match Meta & Highlights */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400 pt-1">
                    <div className="flex items-center gap-4">
                      {m.date && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{m.date}</span>
                        </span>
                      )}
                      {m.time && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{m.time}</span>
                        </span>
                      )}
                      {m.venue && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{m.venue}</span>
                        </span>
                      )}
                    </div>

                    {mvp && (
                      <div className="flex items-center gap-1.5 text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                        <Medal className="w-3.5 h-3.5 fill-amber-400" />
                        <span>MVP: {mvp.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Goal events list */}
                  {m.goalEvents && m.goalEvents.length > 0 && (
                    <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-zinc-500 font-medium">Bàn thắng:</span>
                      {(() => {
                        const counts: Record<string, number> = {};
                        for (const g of m.goalEvents) {
                          counts[g.playerName] = (counts[g.playerName] || 0) + 1;
                        }
                        return Object.entries(counts).map(([name, count]) => (
                          <span
                            key={name}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-300"
                          >
                            <span>⚽</span>
                            <span className="font-semibold text-white">{name}</span>
                            {count > 1 && (
                              <span className="text-emerald-400 font-bold font-mono">({count})</span>
                            )}
                          </span>
                        ));
                      })()}
                    </div>
                  )}

                  {/* Assist events list */}
                  {m.assistEvents && m.assistEvents.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-zinc-500 font-medium">Kiến tạo:</span>
                      {(() => {
                        const counts: Record<string, number> = {};
                        for (const a of m.assistEvents) {
                          counts[a.playerName] = (counts[a.playerName] || 0) + 1;
                        }
                        return Object.entries(counts).map(([name, count]) => (
                          <span
                            key={name}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-300"
                          >
                            <span>👟</span>
                            <span className="font-semibold text-white">{name}</span>
                            {count > 1 && (
                              <span className="text-teal-400 font-bold font-mono">({count})</span>
                            )}
                          </span>
                        ));
                      })()}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Create Match Modal */}
      <CreateMatchModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateMatchSuccess}
      />

      {/* Record Score & Events Modal */}
      {recordingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl sm:max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Nhập kết quả & Thống kê trận đấu</h3>
              </div>
              <button
                onClick={() => setRecordingMatch(null)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* Score Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wide">
                    Tỷ số trận đấu
                  </label>
                  <span className="text-[11px] text-zinc-400">
                    💡 Tự động cập nhật theo số bàn thắng ghi nhận bên dưới
                  </span>
                </div>
                <div className="grid grid-cols-3 items-center gap-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-center">
                  <div>
                    <span className="text-xs text-orange-400 font-bold block mb-1">
                      {recordingMatch.teams[0]?.name || 'Đội Cam'}
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={team1Score}
                      onChange={(e) => setTeam1Score(Math.max(0, Number(e.target.value)))}
                      className="w-16 h-12 text-center text-2xl font-black bg-zinc-900 border border-zinc-700 rounded-xl mx-auto focus:border-emerald-500 text-white font-mono"
                    />
                  </div>

                  <span className="text-2xl font-bold text-zinc-600">-</span>

                  <div>
                    <span className="text-xs text-blue-400 font-bold block mb-1">
                      {recordingMatch.teams[1]?.name || 'Đội Xanh'}
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={team2Score}
                      onChange={(e) => setTeam2Score(Math.max(0, Number(e.target.value)))}
                      className="w-16 h-12 text-center text-2xl font-black bg-zinc-900 border border-zinc-700 rounded-xl mx-auto focus:border-emerald-500 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Goal Scorers */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wide flex items-center gap-1.5">
                    <span>⚽</span>
                    <span>Ghi bàn thắng</span>
                  </label>
                  <span className="text-[11px] text-emerald-400 font-medium">
                    Tổng: {goalEvents.length} bàn
                  </span>
                </div>

                {/* Input row */}
                <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    {/* Player select (6 cols) */}
                    <div className="sm:col-span-6">
                      <select
                        value={selectedScorerId}
                        onChange={(e) => handleSelectScorer(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">-- Chọn cầu thủ ghi bàn --</option>
                        {roster.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.position})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Team select (3 cols) */}
                    <div className="sm:col-span-3">
                      <select
                        value={selectedScorerTeam}
                        onChange={(e) => setSelectedScorerTeam(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-white font-medium"
                      >
                        <option value={1}>{recordingMatch.teams[0]?.name || 'Đội Cam'}</option>
                        <option value={2}>{recordingMatch.teams[1]?.name || 'Đội Xanh'}</option>
                        {recordingMatch.teams[2] && (
                          <option value={3}>{recordingMatch.teams[2].name}</option>
                        )}
                      </select>
                    </div>

                    {/* Goal quantity (3 cols) */}
                    <div className="sm:col-span-3 flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={scorerGoalCount}
                        onChange={(e) => setScorerGoalCount(Math.max(1, Number(e.target.value)))}
                        className="w-12 bg-zinc-900 border border-zinc-800 rounded-xl py-2 text-center text-xs text-white font-bold font-mono focus:border-emerald-500"
                        title="Số lượng bàn thắng"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddGoal()}
                        disabled={!selectedScorerId}
                        className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 text-xs font-bold transition-all shadow cursor-pointer text-center"
                      >
                        + Thêm
                      </button>
                    </div>
                  </div>

                  {/* Quick goal count chips */}
                  <div className="flex items-center gap-1.5 pt-1 text-[11px] text-zinc-400">
                    <span className="text-[10px] text-zinc-500">Chọn nhanh:</span>
                    {[1, 2, 3, 4].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          setScorerGoalCount(num);
                          if (selectedScorerId) {
                            handleAddGoal(num);
                          }
                        }}
                        className={`px-2 py-0.5 rounded-lg border text-[11px] font-semibold cursor-pointer transition-colors ${
                          scorerGoalCount === num
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                        }`}
                      >
                        {num === 3 ? '3 bàn (Hat-trick)' : num === 4 ? '4 bàn (Poker)' : `${num} bàn`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grouped Goals List */}
                {groupedGoals.length > 0 && (
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                    {groupedGoals.map((item) => {
                      const isTeam1 = item.teamId === 1;
                      const teamName = isTeam1
                        ? recordingMatch.teams[0]?.name || 'Đội Cam'
                        : recordingMatch.teams[1]?.name || 'Đội Xanh';
                      return (
                        <div
                          key={`${item.playerId}_${item.teamId}`}
                          className="flex items-center justify-between p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm">⚽</span>
                            <div className="truncate">
                              <span className="font-bold text-white block truncate">{item.playerName}</span>
                              <span
                                className={`text-[10px] font-semibold ${
                                  isTeam1 ? 'text-orange-400' : 'text-blue-400'
                                }`}
                              >
                                {teamName}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold font-mono">
                              {item.count} bàn
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handlePlayerGoalAdjust(item.playerId, item.teamId, -1)}
                                className="w-6 h-6 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold flex items-center justify-center text-xs cursor-pointer active:scale-95"
                                title="Giảm 1 bàn"
                              >
                                -
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePlayerGoalAdjust(item.playerId, item.teamId, 1)}
                                className="w-6 h-6 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold flex items-center justify-center text-xs cursor-pointer active:scale-95"
                                title="Tăng 1 bàn"
                              >
                                +
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveAllGoalsForPlayer(item.playerId, item.teamId)}
                                className="w-6 h-6 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs ml-1 cursor-pointer"
                                title="Xoá tất cả bàn của cầu thủ này"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Assists */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wide flex items-center gap-1.5">
                    <span>👟</span>
                    <span>Kiến tạo bàn thắng</span>
                  </label>
                  <span className="text-[11px] text-teal-400 font-medium">
                    Tổng: {assistEvents.length} kiến tạo
                  </span>
                </div>

                {/* Input row */}
                <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <div className="sm:col-span-6">
                      <select
                        value={selectedAssisterId}
                        onChange={(e) => handleSelectAssister(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                      >
                        <option value="">-- Chọn cầu thủ kiến tạo --</option>
                        {roster.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.position})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <select
                        value={selectedAssisterTeam}
                        onChange={(e) => setSelectedAssisterTeam(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-white font-medium"
                      >
                        <option value={1}>{recordingMatch.teams[0]?.name || 'Đội Cam'}</option>
                        <option value={2}>{recordingMatch.teams[1]?.name || 'Đội Xanh'}</option>
                        {recordingMatch.teams[2] && (
                          <option value={3}>{recordingMatch.teams[2].name}</option>
                        )}
                      </select>
                    </div>

                    <div className="sm:col-span-3 flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={assisterCount}
                        onChange={(e) => setAssisterCount(Math.max(1, Number(e.target.value)))}
                        className="w-12 bg-zinc-900 border border-zinc-800 rounded-xl py-2 text-center text-xs text-white font-bold font-mono focus:border-teal-500"
                        title="Số lượng kiến tạo"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddAssist()}
                        disabled={!selectedAssisterId}
                        className="flex-1 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 text-xs font-bold transition-all shadow cursor-pointer text-center"
                      >
                        + Thêm
                      </button>
                    </div>
                  </div>
                </div>

                {/* Grouped Assists List */}
                {groupedAssists.length > 0 && (
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {groupedAssists.map((item) => {
                      const isTeam1 = item.teamId === 1;
                      const teamName = isTeam1
                        ? recordingMatch.teams[0]?.name || 'Đội Cam'
                        : recordingMatch.teams[1]?.name || 'Đội Xanh';
                      return (
                        <div
                          key={`${item.playerId}_${item.teamId}`}
                          className="flex items-center justify-between p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm">👟</span>
                            <div className="truncate">
                              <span className="font-bold text-white block truncate">{item.playerName}</span>
                              <span
                                className={`text-[10px] font-semibold ${
                                  isTeam1 ? 'text-orange-400' : 'text-blue-400'
                                }`}
                              >
                                {teamName}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-2 py-0.5 rounded-md bg-teal-500/15 border border-teal-500/30 text-teal-400 font-bold font-mono">
                              {item.count} kiến tạo
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handlePlayerAssistAdjust(item.playerId, item.teamId, -1)}
                                className="w-6 h-6 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold flex items-center justify-center text-xs cursor-pointer active:scale-95"
                                title="Giảm 1 kiến tạo"
                              >
                                -
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePlayerAssistAdjust(item.playerId, item.teamId, 1)}
                                className="w-6 h-6 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold flex items-center justify-center text-xs cursor-pointer active:scale-95"
                                title="Tăng 1 kiến tạo"
                              >
                                +
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveAllAssistsForPlayer(item.playerId, item.teamId)}
                                className="w-6 h-6 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs ml-1 cursor-pointer"
                                title="Xoá tất cả kiến tạo của cầu thủ này"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* MVP Player of Match */}
              <div>
                <label className="block text-xs font-bold text-amber-400 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                  <Medal className="w-4 h-4 fill-amber-400" />
                  <span>Bầu chọn Cầu thủ xuất sắc nhất (MVP)</span>
                </label>
                <select
                  value={mvpPlayerId}
                  onChange={(e) => setMvpPlayerId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="">-- Chưa chọn MVP --</option>
                  {roster.map((p) => (
                    <option key={p.id} value={p.id}>
                      ⭐ {p.name} ({p.position} - {p.rating}đ)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800 bg-zinc-950/60">
              <button
                type="button"
                onClick={() => setRecordingMatch(null)}
                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveResult}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/20"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Lưu kết quả & Cập nhật thống kê</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
