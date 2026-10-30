'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import { useClubStore } from '@/lib/club-store';
import { POSITION_LABELS } from '@/types/football';
import {
  Trophy,
  Flame,
  Medal,
  Award,
  Crown,
  Star,
  Users,
  CheckCircle,
  BarChart3,
  TrendingUp,
} from 'lucide-react';

export default function StatsPage() {
  const { roster, matches } = useClubStore();
  const [activeTab, setActiveTab] = useState<'scorers' | 'assists' | 'mvp' | 'winrate'>('scorers');

  // Sorted categories
  const topScorers = [...roster].sort((a, b) => b.goals - a.goals);
  const topAssists = [...roster].sort((a, b) => b.assists - a.assists);
  const topMvps = [...roster].sort((a, b) => b.mvpCount - a.mvpCount);
  const topWinRates = [...roster]
    .filter((p) => p.matchesPlayed >= 3)
    .sort((a, b) => {
      const wrA = (a.wins / a.matchesPlayed) * 100;
      const wrB = (b.wins / b.matchesPlayed) * 100;
      return wrB - wrA;
    });

  // Overall Club Totals
  const totalGoals = roster.reduce((sum, p) => sum + p.goals, 0);
  const totalMatches = matches.length;
  const activeMembers = roster.length;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col selection:bg-emerald-500 selection:text-zinc-950">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 w-full flex-1 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-emerald-400" />
              <h1 className="text-2xl font-black text-white tracking-tight">
                Bảng vàng Thống kê & Thành tích
              </h1>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Xếp hạng Vua phá lưới, Vua kiến tạo, Danh hiệu MVP & Phong độ thi đấu
            </p>
          </div>

          {/* Quick Summary Pill */}
          <div className="flex items-center gap-3 bg-zinc-900 px-4 py-2 rounded-2xl border border-zinc-800 text-xs">
            <div>
              <span className="text-zinc-500 block text-[10px]">Tổng số trận</span>
              <strong className="text-white font-mono text-sm">{totalMatches} trận</strong>
            </div>
            <div className="w-[1px] h-6 bg-zinc-800" />
            <div>
              <span className="text-zinc-500 block text-[10px]">Tổng bàn thắng</span>
              <strong className="text-emerald-400 font-mono text-sm">{totalGoals} bàn</strong>
            </div>
            <div className="w-[1px] h-6 bg-zinc-800" />
            <div>
              <span className="text-zinc-500 block text-[10px]">Quân số</span>
              <strong className="text-teal-400 font-mono text-sm">{activeMembers} cầu thủ</strong>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-zinc-900/60 p-1.5 rounded-2xl border border-zinc-800 text-xs">
          <button
            onClick={() => setActiveTab('scorers')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'scorers'
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>Vua phá lưới (Goals)</span>
          </button>

          <button
            onClick={() => setActiveTab('assists')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'assists'
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Vua kiến tạo (Assists)</span>
          </button>

          <button
            onClick={() => setActiveTab('mvp')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'mvp'
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Danh hiệu MVP</span>
          </button>

          <button
            onClick={() => setActiveTab('winrate')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'winrate'
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Tỷ lệ thắng (Win %)</span>
          </button>
        </div>

        {/* Podium for Top 3 */}
        {(() => {
          const list =
            activeTab === 'scorers'
              ? topScorers
              : activeTab === 'assists'
              ? topAssists
              : activeTab === 'mvp'
              ? topMvps
              : topWinRates;

          const first = list[0];
          const second = list[1];
          const third = list[2];

          const getStatLabel = (p: typeof first) => {
            if (!p) return '';
            if (activeTab === 'scorers') return `${p.goals} bàn thắng`;
            if (activeTab === 'assists') return `${p.assists} kiến tạo`;
            if (activeTab === 'mvp') return `${p.mvpCount} lần MVP`;
            const wr = p.matchesPlayed > 0 ? Math.round((p.wins / p.matchesPlayed) * 100) : 0;
            return `${wr}% Thắng (${p.wins}/${p.matchesPlayed})`;
          };

          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-4">
              {/* 2nd Place */}
              {second && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 text-center relative overflow-hidden order-2 md:order-1 shadow-lg">
                  <div className="w-10 h-10 rounded-full bg-slate-300 text-zinc-950 font-black text-sm flex items-center justify-center mx-auto mb-2 border-2 border-white shadow-md">
                    2
                  </div>
                  <h3 className="font-extrabold text-base text-white">{second.name}</h3>
                  <span className="text-[10px] text-zinc-400 block mb-2">{second.position}</span>
                  <div className="text-sm font-black text-slate-300 bg-zinc-950/80 py-1.5 px-3 rounded-xl border border-zinc-800 inline-block font-mono">
                    {getStatLabel(second)}
                  </div>
                </div>
              )}

              {/* 1st Place (Champion) */}
              {first && (
                <div className="bg-gradient-to-b from-amber-500/10 via-zinc-900 to-zinc-900 border-2 border-amber-500/40 rounded-3xl p-6 text-center relative overflow-hidden order-1 md:order-2 shadow-2xl scale-105 z-10">
                  <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-zinc-950 font-black text-base flex items-center justify-center mx-auto mb-2 border-2 border-amber-200 shadow-xl shadow-amber-500/30">
                    👑 1
                  </div>
                  <h3 className="font-black text-lg text-white">{first.name}</h3>
                  <span className="text-xs text-amber-400 font-semibold block mb-2">{first.position}</span>
                  <div className="text-base font-black text-amber-400 bg-zinc-950 py-2 px-4 rounded-xl border border-amber-500/30 inline-block font-mono shadow-md">
                    {getStatLabel(first)}
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {third && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 text-center relative overflow-hidden order-3 shadow-lg">
                  <div className="w-10 h-10 rounded-full bg-amber-700 text-white font-black text-sm flex items-center justify-center mx-auto mb-2 border-2 border-amber-600 shadow-md">
                    3
                  </div>
                  <h3 className="font-extrabold text-base text-white">{third.name}</h3>
                  <span className="text-[10px] text-zinc-400 block mb-2">{third.position}</span>
                  <div className="text-sm font-black text-amber-600 bg-zinc-950/80 py-1.5 px-3 rounded-xl border border-zinc-800 inline-block font-mono">
                    {getStatLabel(third)}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Full Table Leaderboard */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-950/50 flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Bảng xếp hạng chi tiết toàn đội</h3>
            <span className="text-xs text-zinc-500 font-mono">{roster.length} cầu thủ</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Cầu thủ</th>
                  <th className="py-3 px-4 text-center">Vị trí</th>
                  <th className="py-3 px-4 text-center">Số trận</th>
                  <th className="py-3 px-4 text-center">Bàn thắng</th>
                  <th className="py-3 px-4 text-center">Kiến tạo</th>
                  <th className="py-3 px-4 text-center">MVP</th>
                  <th className="py-3 px-4 text-center">Thắng - Hòa - Thua</th>
                  <th className="py-3 px-4 text-right">Tỷ lệ thắng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {(activeTab === 'scorers'
                  ? topScorers
                  : activeTab === 'assists'
                  ? topAssists
                  : activeTab === 'mvp'
                  ? topMvps
                  : topWinRates
                ).map((p, idx) => {
                  const pos = POSITION_LABELS[p.position];
                  const winRate =
                    p.matchesPlayed > 0 ? Math.round((p.wins / p.matchesPlayed) * 100) : 0;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-zinc-800/40 transition-colors group"
                    >
                      <td className="py-3 px-4 text-center font-bold text-zinc-500 font-mono">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-white group-hover:text-emerald-400 transition-colors">
                        {p.name}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${pos.badgeClass}`}
                        >
                          {p.position}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-zinc-300">
                        {p.matchesPlayed}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">
                        {p.goals}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-teal-400">
                        {p.assists}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-amber-400">
                        {p.mvpCount}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-zinc-400 text-[11px]">
                        {p.wins}W - {p.draws}D - {p.losses}L
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                        {winRate}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

