'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import { useClubStore } from '@/lib/club-store';
import { Player, POSITION_LABELS } from '@/types/football';
import {
  Scale,
  Star,
  Trophy,
  Flame,
  Award,
  ArrowRightLeft,
  Crown,
  CheckCircle,
} from 'lucide-react';

export default function ComparePage() {
  const { roster } = useClubStore();

  const [playerAId, setPlayerAId] = useState<string>(roster[7]?.id || roster[0]?.id || '');
  const [playerBId, setPlayerBId] = useState<string>(roster[9]?.id || roster[1]?.id || '');

  const playerA = roster.find((p) => p.id === playerAId) || roster[0];
  const playerB = roster.find((p) => p.id === playerBId) || roster[1];

  const handleSwap = () => {
    const temp = playerAId;
    setPlayerAId(playerBId);
    setPlayerBId(temp);
  };

  const getWinRate = (p?: Player) =>
    p && p.matchesPlayed > 0 ? Math.round((p.wins / p.matchesPlayed) * 100) : 0;

  const getGoalsPerMatch = (p?: Player) =>
    p && p.matchesPlayed > 0 ? (p.goals / p.matchesPlayed).toFixed(2) : '0.00';

  const metrics = [
    {
      label: '⭐ Điểm trình độ (Rating)',
      valA: playerA?.rating || 0,
      valB: playerB?.rating || 0,
      suffix: '/10',
    },
    {
      label: '⚽ Bàn thắng (Goals)',
      valA: playerA?.goals || 0,
      valB: playerB?.goals || 0,
      suffix: ' bàn',
    },
    {
      label: '👟 Kiến tạo (Assists)',
      valA: playerA?.assists || 0,
      valB: playerB?.assists || 0,
      suffix: ' kiến tạo',
    },
    {
      label: '🏃 Số trận thi đấu',
      valA: playerA?.matchesPlayed || 0,
      valB: playerB?.matchesPlayed || 0,
      suffix: ' trận',
    },
    {
      label: '🔥 Tỷ lệ thắng (Win rate)',
      valA: getWinRate(playerA),
      valB: getWinRate(playerB),
      suffix: '%',
    },
    {
      label: '🏆 Danh hiệu MVP',
      valA: playerA?.mvpCount || 0,
      valB: playerB?.mvpCount || 0,
      suffix: ' lần',
    },
    {
      label: '⚡ Hiệu suất bàn/trận',
      valA: parseFloat(getGoalsPerMatch(playerA)),
      valB: parseFloat(getGoalsPerMatch(playerB)),
      suffix: ' bàn/trận',
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col selection:bg-emerald-500 selection:text-zinc-950">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8 w-full flex-1 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Scale className="w-4 h-4" />
            <span>FootDraw Head-to-Head Compare</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">So sánh Cầu thủ Đối đầu</h1>
          <p className="text-xs text-zinc-400">
            Đặt 2 thành viên lên bàn cân để so sánh trực diện chỉ số, phong độ và hiệu quả thi đấu
          </p>
        </div>

        {/* Player Selectors & Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-11 gap-4 items-center">
          {/* Player A Card */}
          <div className="sm:col-span-5 bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-xl text-center space-y-3">
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider text-left">
              Cầu thủ A
            </label>
            <select
              value={playerAId}
              onChange={(e) => setPlayerAId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
            >
              {roster.map((p) => (
                <option key={p.id} value={p.id} disabled={p.id === playerBId}>
                  {p.name} ({p.position})
                </option>
              ))}
            </select>

            {playerA && (
              <div className="pt-2 space-y-1">
                <div className="w-16 h-16 rounded-2xl bg-orange-500/20 border-2 border-orange-500/50 text-orange-400 text-lg font-black flex items-center justify-center mx-auto shadow-lg shadow-orange-500/20">
                  {POSITION_LABELS[playerA.position].short}
                </div>
                <h3 className="font-black text-lg text-white">{playerA.name}</h3>
                <span className="text-xs text-zinc-400 font-semibold block">
                  {POSITION_LABELS[playerA.position].label}
                </span>
              </div>
            )}
          </div>

          {/* Swap Button (Col 1) */}
          <div className="sm:col-span-1 flex justify-center">
            <button
              onClick={handleSwap}
              className="p-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-emerald-400 shadow-md transition-transform active:scale-90"
              title="Đổi bên"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Player B Card */}
          <div className="sm:col-span-5 bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-xl text-center space-y-3">
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider text-left">
              Cầu thủ B
            </label>
            <select
              value={playerBId}
              onChange={(e) => setPlayerBId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-teal-500"
            >
              {roster.map((p) => (
                <option key={p.id} value={p.id} disabled={p.id === playerAId}>
                  {p.name} ({p.position})
                </option>
              ))}
            </select>

            {playerB && (
              <div className="pt-2 space-y-1">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border-2 border-blue-500/50 text-blue-400 text-lg font-black flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
                  {POSITION_LABELS[playerB.position].short}
                </div>
                <h3 className="font-black text-lg text-white">{playerB.name}</h3>
                <span className="text-xs text-zinc-400 font-semibold block">
                  {POSITION_LABELS[playerB.position].label}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Head-to-Head Comparison Bars */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider pb-3 border-b border-zinc-800 text-center">
            Chi tiết chỉ số đối đầu
          </h3>

          <div className="space-y-4">
            {metrics.map((m, idx) => {
              const maxVal = Math.max(m.valA, m.valB, 1);
              const isAWinner = m.valA > m.valB;
              const isBWinner = m.valB > m.valA;

              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`font-mono font-bold ${
                        isAWinner ? 'text-emerald-400' : 'text-zinc-400'
                      }`}
                    >
                      {m.valA} {m.suffix}
                    </span>
                    <span className="font-semibold text-zinc-300 text-center px-2">
                      {m.label}
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        isBWinner ? 'text-teal-400' : 'text-zinc-400'
                      }`}
                    >
                      {m.valB} {m.suffix}
                    </span>
                  </div>

                  {/* Dual Bar */}
                  <div className="grid grid-cols-2 gap-1 h-2.5 bg-zinc-950 rounded-full p-0.5 border border-zinc-800 overflow-hidden">
                    {/* Left Bar (A) - aligns right */}
                    <div className="flex justify-end">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isAWinner ? 'bg-orange-500' : 'bg-zinc-700'
                        }`}
                        style={{ width: `${(m.valA / maxVal) * 100}%` }}
                      />
                    </div>

                    {/* Right Bar (B) - aligns left */}
                    <div className="flex justify-start">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isBWinner ? 'bg-blue-500' : 'bg-zinc-700'
                        }`}
                        style={{ width: `${(m.valB / maxVal) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

