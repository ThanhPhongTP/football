'use client';

import React, { useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import AddPlayerModal from '@/components/AddPlayerModal';
import { useClubStore } from '@/lib/club-store';
import { Player, Position, POSITION_LABELS } from '@/types/football';
import {
  Users,
  Search,
  UserPlus,
  Star,
  Trophy,
  Flame,
  Award,
  Edit2,
  Trash2,
  ArrowUpDown,
  Filter,
} from 'lucide-react';

export default function PlayersPage() {
  const { roster, upsertPlayer, deletePlayer } = useClubStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<'ALL' | Position>('ALL');
  const [sortBy, setSortBy] = useState<'rating' | 'goals' | 'assists' | 'matches' | 'winrate'>('rating');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Filter & Sort
  const processedPlayers = useMemo(() => {
    return roster
      .filter((p) => {
        const matchesName = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPos = selectedPosition === 'ALL' || p.position === selectedPosition;
        return matchesName && matchesPos;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'goals') return b.goals - a.goals;
        if (sortBy === 'assists') return b.assists - a.assists;
        if (sortBy === 'matches') return b.matchesPlayed - a.matchesPlayed;
        if (sortBy === 'winrate') {
          const wrA = a.matchesPlayed > 0 ? (a.wins / a.matchesPlayed) * 100 : 0;
          const wrB = b.matchesPlayed > 0 ? (b.wins / b.matchesPlayed) * 100 : 0;
          return wrB - wrA;
        }
        return 0;
      });
  }, [roster, searchTerm, selectedPosition, sortBy]);

  const handleSavePlayer = (player: Player) => {
    // preserve past stats if editing
    const existing = roster.find((p) => p.id === player.id);
    const merged: Player = {
      ...player,
      matchesPlayed: existing?.matchesPlayed || 0,
      goals: existing?.goals || 0,
      assists: existing?.assists || 0,
      wins: existing?.wins || 0,
      draws: existing?.draws || 0,
      losses: existing?.losses || 0,
      mvpCount: existing?.mvpCount || 0,
    };
    upsertPlayer(merged);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Bạn có chắc muốn xóa cầu thủ "${name}" khỏi danh sách đội?`)) {
      deletePlayer(id);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col selection:bg-emerald-500 selection:text-zinc-950">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 w-full flex-1 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-400" />
              <h1 className="text-2xl font-black text-white tracking-tight">Hồ sơ thành viên đội bóng</h1>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Quản lý danh sách cầu thủ cố định, điểm trình độ, bàn thắng, kiến tạo & tỷ lệ thắng
            </p>
          </div>

          <button
            onClick={() => {
              setEditingPlayer(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all self-start sm:self-auto cursor-pointer"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span>Thêm thành viên mới</span>
          </button>
        </div>

        {/* Toolbar: Search, Position Filter, Sort */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo tên cầu thủ..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Position Pills */}
          <div className="flex items-center gap-1 overflow-x-auto text-xs pb-1 md:pb-0">
            {(['ALL', 'GK', 'DEF', 'MID', 'FWD'] as const).map((pos) => (
              <button
                key={pos}
                onClick={() => setSelectedPosition(pos)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                  selectedPosition === pos
                    ? 'bg-emerald-500 text-zinc-950 shadow-md'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {pos === 'ALL' ? 'Tất cả' : pos}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-500 shrink-0 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              Sắp xếp:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="rating">⭐ Điểm Rating</option>
              <option value="goals">⚽ Bàn thắng (Nhiều nhất)</option>
              <option value="assists">👟 Kiến tạo (Nhiều nhất)</option>
              <option value="matches">🏃 Số trận thi đấu</option>
              <option value="winrate">🔥 Tỷ lệ thắng (%)</option>
            </select>
          </div>
        </div>

        {/* Players Grid Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {processedPlayers.map((player) => {
            const posMeta = POSITION_LABELS[player.position];
            const winRate =
              player.matchesPlayed > 0
                ? Math.round((player.wins / player.matchesPlayed) * 100)
                : 0;

            return (
              <div
                key={player.id}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-xl hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4 group"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {/* Jersey avatar */}
                    <div
                      className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center font-black text-sm text-emerald-400 shadow-inner group-hover:border-emerald-500/50 transition-colors"
                    >
                      {posMeta.short}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-white group-hover:text-emerald-400 transition-colors">
                        {player.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${posMeta.badgeClass}`}
                        >
                          {posMeta.label}
                        </span>
                        <span className="text-xs text-amber-400 font-bold flex items-center gap-0.5">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{player.rating}/10</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingPlayer(player);
                        setIsAddModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                      title="Chỉnh sửa"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(player.id, player.name)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800"
                      title="Xóa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Stats Matrix */}
                <div className="grid grid-cols-4 gap-2 bg-zinc-950/80 p-3 rounded-2xl border border-zinc-800/80 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Số trận</span>
                    <span className="font-extrabold text-white text-sm">{player.matchesPlayed}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Bàn thắng</span>
                    <span className="font-extrabold text-emerald-400 text-sm">⚽ {player.goals}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Kiến tạo</span>
                    <span className="font-extrabold text-teal-400 text-sm">👟 {player.assists}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Thắng %</span>
                    <span className="font-extrabold text-amber-400 text-sm">{winRate}%</span>
                  </div>
                </div>

                {/* Footer: Win-Draw-Loss & MVP Badge */}
                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-zinc-800/80">
                  <span className="font-mono">
                    {player.wins}W - {player.draws}D - {player.losses}L
                  </span>

                  {player.mvpCount > 0 ? (
                    <span className="flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 text-[10px]">
                      <Trophy className="w-3 h-3 fill-amber-400" />
                      <span>{player.mvpCount} MVP</span>
                    </span>
                  ) : (
                    <span className="text-zinc-600">0 MVP</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Modal */}
      <AddPlayerModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingPlayer(null);
        }}
        onAdd={handleSavePlayer}
        initialPlayer={editingPlayer}
      />
    </div>
  );
}

