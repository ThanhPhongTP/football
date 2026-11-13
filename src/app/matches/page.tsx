'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
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
  Flame,
  Check,
  X,
  Edit3,
  Lock,
} from 'lucide-react';

export default function MatchesPage() {
  const { isAdmin, openPasswordModal } = useAdminAuth();
  const { matches, roster, recordMatchResult } = useClubStore();
  const [filter, setFilter] = useState<'ALL' | 'UPCOMING' | 'COMPLETED'>('ALL');
  const [recordingMatch, setRecordingMatch] = useState<Match | null>(null);

  // Score record modal states
  const [team1Score, setTeam1Score] = useState<number>(0);
  const [team2Score, setTeam2Score] = useState<number>(0);
  const [goalEvents, setGoalEvents] = useState<GoalEvent[]>([]);
  const [assistEvents, setAssistEvents] = useState<AssistEvent[]>([]);
  const [mvpPlayerId, setMvpPlayerId] = useState<string>('');
  const [selectedScorerId, setSelectedScorerId] = useState<string>('');
  const [selectedScorerTeam, setSelectedScorerTeam] = useState<number>(1);
  const [selectedAssisterId, setSelectedAssisterId] = useState<string>('');
  const [selectedAssisterTeam, setSelectedAssisterTeam] = useState<number>(1);

  const filteredMatches = matches.filter((m) => {
    if (filter === 'UPCOMING') return m.status !== 'COMPLETED';
    if (filter === 'COMPLETED') return m.status === 'COMPLETED';
    return true;
  });

  const handleOpenRecordModal = (match: Match) => {
    setRecordingMatch(match);
    setTeam1Score(match.score?.team1 || 0);
    setTeam2Score(match.score?.team2 || 0);
    setGoalEvents(match.goalEvents || []);
    setAssistEvents(match.assistEvents || []);
    setMvpPlayerId(match.mvpPlayerId || '');
  };

  const handleAddGoal = () => {
    if (!selectedScorerId) return;
    const player = roster.find((p) => p.id === selectedScorerId);
    if (!player) return;

    setGoalEvents([
      ...goalEvents,
      {
        id: `g_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        playerId: player.id,
        playerName: player.name,
        teamId: selectedScorerTeam,
      },
    ]);

    // increment corresponding score
    if (selectedScorerTeam === 1) setTeam1Score((prev) => prev + 1);
    if (selectedScorerTeam === 2) setTeam2Score((prev) => prev + 1);
  };

  const handleRemoveGoal = (id: string, teamId: number) => {
    setGoalEvents(goalEvents.filter((g) => g.id !== id));
    if (teamId === 1 && team1Score > 0) setTeam1Score((prev) => prev - 1);
    if (teamId === 2 && team2Score > 0) setTeam2Score((prev) => prev - 1);
  };

  const handleAddAssist = () => {
    if (!selectedAssisterId) return;
    const player = roster.find((p) => p.id === selectedAssisterId);
    if (!player) return;

    setAssistEvents([
      ...assistEvents,
      {
        id: `a_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        playerId: player.id,
        playerName: player.name,
        teamId: selectedAssisterTeam,
      },
    ]);
  };

  const handleRemoveAssist = (id: string) => {
    setAssistEvents(assistEvents.filter((a) => a.id !== id));
  };

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

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col selection:bg-emerald-500 selection:text-zinc-950">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 w-full flex-1 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-emerald-400" />
              <h1 className="text-2xl font-black text-white tracking-tight">Quản lý các trận đấu</h1>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Theo dõi lịch thi đấu, ghi nhận tỷ số, bàn thắng, kiến tạo & bầu chọn MVP
            </p>
          </div>

          {isAdmin ? (
            <Link
              href="/draw"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Tạo trận mới</span>
            </Link>
          ) : (
            <button
              onClick={openPasswordModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-800 transition-colors self-start sm:self-auto cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-zinc-400" />
              <span>Đội trưởng đăng nhập</span>
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900 rounded-xl border border-zinc-800 max-w-sm text-xs">
          <button
            onClick={() => setFilter('ALL')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${filter === 'ALL'
                ? 'bg-emerald-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
              }`}
          >
            Tất cả ({matches.length})
          </button>
          <button
            onClick={() => setFilter('UPCOMING')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${filter === 'UPCOMING'
                ? 'bg-emerald-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
              }`}
          >
            Sắp đá ({matches.filter((m) => m.status !== 'COMPLETED').length})
          </button>
          <button
            onClick={() => setFilter('COMPLETED')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${filter === 'COMPLETED'
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
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-white font-semibold transition-colors"
              >
                Tạo trận đấu ngay →
              </Link>
            </div>
          ) : (
            filteredMatches.map((m) => {
              const isCompleted = m.status === 'COMPLETED';
              const team1 = m.teams[0];
              const team2 = m.teams[1];
              const mvp = roster.find((p) => p.id === m.mvpPlayerId);

              return (
                <div
                  key={m.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xl hover:border-zinc-700 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${isCompleted
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
                      <h3 className="font-extrabold text-base sm:text-lg text-white">{m.title}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {isAdmin ? (
                        <button
                          onClick={() => handleOpenRecordModal(m)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                          <span>{isCompleted ? 'Sửa tỷ số' : 'Nhập tỷ số'}</span>
                        </button>
                      ) : (
                        <button
                          onClick={openPasswordModal}
                          title="Nhập mật khẩu để mở quyền nhập tỷ số"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-medium border border-zinc-800 transition-colors cursor-pointer"
                        >
                          <Lock className="w-3 h-3 text-zinc-500" />
                          <span>Đội trưởng nhập điểm</span>
                        </button>
                      )}

                      <Link
                        href={`/match/${m.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-colors"
                      >
                        <span>Mở phòng</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
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
                      {isCompleted ? (
                        <div className="flex items-center justify-center gap-3 font-mono font-black text-2xl sm:text-3xl text-white">
                          <span className={team1Score > team2Score ? 'text-emerald-400' : 'text-zinc-300'}>
                            {m.score?.team1 ?? team1Score}
                          </span>
                          <span className="text-zinc-600">-</span>
                          <span className={team2Score > team1Score ? 'text-emerald-400' : 'text-zinc-300'}>
                            {m.score?.team2 ?? team2Score}
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
                      {m.goalEvents.map((g) => (
                        <span
                          key={g.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-300"
                        >
                          <span>⚽</span>
                          <span className="font-semibold">{g.playerName}</span>
                          {g.minute ? <span className="text-zinc-500">{g.minute}&apos;</span> : null}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Record Score & Events Modal */}
      {recordingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
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

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Score Input */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-2 uppercase tracking-wide">
                  Tỷ số chung cuộc
                </label>
                <div className="grid grid-cols-3 items-center gap-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-center">
                  <div>
                    <span className="text-xs text-orange-400 font-bold block mb-1">
                      {recordingMatch.teams[0]?.name || 'Đội Cam'}
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={team1Score}
                      onChange={(e) => setTeam1Score(Number(e.target.value))}
                      className="w-16 h-12 text-center text-2xl font-black bg-zinc-900 border border-zinc-700 rounded-xl mx-auto focus:border-emerald-500 text-white"
                    />
                  </div>

                  <span className="text-xl font-bold text-zinc-600">-</span>

                  <div>
                    <span className="text-xs text-blue-400 font-bold block mb-1">
                      {recordingMatch.teams[1]?.name || 'Đội Xanh'}
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={team2Score}
                      onChange={(e) => setTeam2Score(Number(e.target.value))}
                      className="w-16 h-12 text-center text-2xl font-black bg-zinc-900 border border-zinc-700 rounded-xl mx-auto focus:border-emerald-500 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Goal Scorers */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wide">
                  ⚽ Thêm cầu thủ ghi bàn
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedScorerId}
                    onChange={(e) => setSelectedScorerId(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Chọn cầu thủ ghi bàn --</option>
                    {roster.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.position})
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedScorerTeam}
                    onChange={(e) => setSelectedScorerTeam(Number(e.target.value))}
                    className="bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-white"
                  >
                    <option value={1}>Đội Cam</option>
                    <option value={2}>Đội Xanh</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleAddGoal}
                    className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold"
                  >
                    + Thêm
                  </button>
                </div>

                {/* Goals list */}
                {goalEvents.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {goalEvents.map((g) => (
                      <span
                        key={g.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-xs"
                      >
                        <span>⚽ {g.playerName}</span>
                        <button
                          onClick={() => handleRemoveGoal(g.id, g.teamId)}
                          className="text-zinc-500 hover:text-rose-400"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Assists */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wide">
                  👟 Thêm cầu thủ kiến tạo
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedAssisterId}
                    onChange={(e) => setSelectedAssisterId(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Chọn cầu thủ kiến tạo --</option>
                    {roster.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.position})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleAddAssist}
                    className="px-3 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-zinc-950 text-xs font-bold"
                  >
                    + Thêm
                  </button>
                </div>

                {/* Assists list */}
                {assistEvents.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {assistEvents.map((a) => (
                      <span
                        key={a.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-xs"
                      >
                        <span>👟 {a.playerName}</span>
                        <button
                          onClick={() => handleRemoveAssist(a.id)}
                          className="text-zinc-500 hover:text-rose-400"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
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

