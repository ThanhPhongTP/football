'use client';

import React from 'react';
import { Team, POSITION_LABELS } from '@/types/football';
import { Star, Shield } from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';

interface FootballPitchViewProps {
  teams: Team[];
  matchTitle: string;
  matchInfo: string;
  hideRating?: boolean;
}

  export default function FootballPitchView({ teams, matchTitle, matchInfo, hideRating }: FootballPitchViewProps) {
    const { isAdmin } = useAdminAuth();
    const showRating = isAdmin && !hideRating;
    if (teams.length === 0 || teams.every((t) => t.players.length === 0)) {
      return (
        <div className="p-8 text-center text-zinc-500 rounded-2xl border border-zinc-800 bg-zinc-950">
          Chưa có dữ liệu chia đội. Hãy bấm &quot;Chia đội tự động&quot; để tạo sa bàn.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Container to be exported as image */}
        <div
          id="pitch-export-container"
          className="relative bg-zinc-950 p-4 sm:p-6 rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden text-white"
          style={{ minWidth: '320px' }}
        >
          {/* Pitch Branding Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950">
                <span className="text-base">⚽</span>
              </div>
              <div>
                <h2 className="font-bold text-sm sm:text-base text-white tracking-tight">{matchTitle}</h2>
                <p className="text-[11px] text-zinc-400">{matchInfo}</p>
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold tracking-wide">
              FOOTDRAW SA BÀN ĐỘI HÌNH
            </div>
          </div>

          {/* Realistic Soccer Pitch */}
          <div className="relative w-full rounded-2xl overflow-hidden border-2 border-emerald-400/40 shadow-inner bg-emerald-900 aspect-[16/10] min-h-[380px] sm:min-h-[460px] flex items-center justify-center p-3 select-none">
            {/* Pitch Grass Stripes (Alternating green shades) */}
            <div
              className="absolute inset-0 pointer-events-none opacity-90"
              style={{
                background: `repeating-linear-gradient(
                90deg,
                #14532d 0px,
                #14532d 60px,
                #166534 60px,
                #166534 120px
              )`,
              }}
            />

            {/* White Pitch Markings */}
            <div className="absolute inset-3 border-2 border-white/40 rounded pointer-events-none">
              {/* Halfway Line */}
              <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-white/40 -translate-x-1/2" />

              {/* Center Circle */}
              <div className="absolute top-1/2 left-1/2 w-28 h-28 sm:w-36 sm:h-36 border-2 border-white/40 rounded-full -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                {/* Center Spot */}
                <div className="w-2.5 h-2.5 bg-white/60 rounded-full" />
              </div>

              {/* Left Penalty Area */}
              <div className="absolute top-1/2 left-0 w-20 sm:w-28 h-40 sm:h-52 border-2 border-l-0 border-white/40 -translate-y-1/2">
                <div className="absolute top-1/2 left-0 w-8 sm:w-12 h-20 sm:h-24 border-2 border-l-0 border-white/40 -translate-y-1/2" />
                {/* Penalty Spot */}
                <div className="absolute top-1/2 right-4 w-2 h-2 bg-white/60 rounded-full -translate-y-1/2" />
              </div>

              {/* Right Penalty Area */}
              <div className="absolute top-1/2 right-0 w-20 sm:w-28 h-40 sm:h-52 border-2 border-r-0 border-white/40 -translate-y-1/2">
                <div className="absolute top-1/2 right-0 w-8 sm:w-12 h-20 sm:h-24 border-2 border-r-0 border-white/40 -translate-y-1/2" />
                {/* Penalty Spot */}
                <div className="absolute top-1/2 left-4 w-2 h-2 bg-white/60 rounded-full -translate-y-1/2" />
              </div>

              {/* Corner Arcs */}
              <div className="absolute top-0 left-0 w-4 h-4 border-b border-r border-white/40 rounded-br-full" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-t border-r border-white/40 rounded-tr-full" />
              <div className="absolute top-0 right-0 w-4 h-4 border-b border-l border-white/40 rounded-bl-full" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-t border-l border-white/40 rounded-tl-full" />
            </div>

            {/* Players Overlay on Pitch */}
            <div className="relative z-10 w-full h-full flex flex-row items-center justify-between px-2 sm:px-6">
              {teams.slice(0, 2).map((team, tIdx) => {
                const isLeftSide = tIdx === 0;

                // Group team players by formation
                const gk = team.players.filter((p) => p.position === 'GK');
                const def = team.players.filter((p) => p.position === 'DEF');
                const mid = team.players.filter((p) => p.position === 'MID');
                const fwd = team.players.filter((p) => p.position === 'FWD');

                // Lineup lines from goal to center: GK -> DEF -> MID -> FWD
                const lines = isLeftSide
                  ? [gk, def, mid, fwd]
                  : [fwd, mid, def, gk];

                return (
                  <div
                    key={team.id}
                    className={`flex-1 h-full flex ${isLeftSide ? 'flex-row' : 'flex-row'
                      } items-center justify-around py-2`}
                  >
                    {lines.map((group, lineIdx) => (
                      <div
                        key={lineIdx}
                        className="flex flex-col items-center justify-around h-full py-1 gap-1"
                      >
                        {group.map((player) => {
                          const posInfo = POSITION_LABELS[player.position];
                          const isOrange = team.colorName.toLowerCase().includes('cam');
                          const isBlue = team.colorName.toLowerCase().includes('xanh');
                          const isRed = team.colorName.toLowerCase().includes('đỏ');

                          const shirtColor = isOrange
                            ? 'bg-orange-500 text-white border-orange-300'
                            : isBlue
                              ? 'bg-blue-600 text-white border-blue-300'
                              : isRed
                                ? 'bg-rose-600 text-white border-rose-300'
                                : 'bg-emerald-500 text-black border-white';

                          return (
                            <div
                              key={player.id}
                              className="flex flex-col items-center group cursor-pointer"
                            >
                              {/* Shirt icon / Badge */}
                              <div
                                className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full ${shirtColor} border-2 shadow-lg flex items-center justify-center font-bold text-[10px] sm:text-xs transition-transform transform group-hover:scale-110`}
                              >
                                <span>{posInfo.short}</span>
                              </div>

                              {/* Name & Rating Label */}
                              <div className="mt-1 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-sm border border-white/20 text-center max-w-[70px] sm:max-w-[85px]">
                                <p className="text-[9px] sm:text-[10px] font-bold text-white truncate leading-tight">
                                  {player.name}
                                </p>
                                {showRating && (
                                  <div className="flex items-center justify-center gap-0.5 text-[8px] text-amber-300">
                                    <span>★</span>
                                    <span>{player.rating}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Squad Breakdown Cards Below Pitch */}
          <div className={`mt-4 grid grid-cols-1 ${teams.length > 2 ? 'md:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
            {teams.map((team) => (
              <div
                key={team.id}
                className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${team.badgeBg}`}>
                        {team.name}
                      </span>
                      <span className="text-xs text-zinc-400">({team.players.length} cầu thủ)</span>
                    </div>
                    {showRating && (
                      <div className="flex items-center gap-1 text-xs text-amber-400 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{team.totalRating}đ (TB: {team.avgRating})</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {team.players.map((p) => {
                      const pos = POSITION_LABELS[p.position];
                      return (
                        <span
                          key={p.id}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-xs"
                        >
                          <span className={`text-[10px] font-bold px-1 rounded ${pos.badgeClass}`}>
                            {p.position}
                          </span>
                          <span className="text-zinc-200 font-medium">{p.name}</span>
                          {showRating && <span className="text-[10px] text-amber-400">★{p.rating}</span>}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Position Distribution summary */}
                <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Tuyến:</span>
                  <span className="font-mono">
                    {team.gkCount} GK • {team.defCount} DEF • {team.midCount} MID • {team.fwdCount} FWD
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

