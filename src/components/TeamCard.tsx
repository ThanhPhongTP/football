'use client';

import React from 'react';
import { Team, Player, POSITION_LABELS } from '@/types/football';
import { Star, ArrowLeftRight, Shield } from 'lucide-react';

interface TeamCardProps {
  team: Team;
  selectedPlayerForSwap: Player | null;
  onSelectPlayerForSwap: (player: Player) => void;
}

export default function TeamCard({
  team,
  selectedPlayerForSwap,
  onSelectPlayerForSwap,
}: TeamCardProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
      {/* Team Header */}
      <div className={`p-4 bg-gradient-to-r ${team.bgGradient} border-b border-zinc-800/80 flex items-center justify-between`}>
        <div className="flex items-center gap-2.5">
          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide uppercase shadow-sm ${team.badgeBg}`}>
            {team.colorName}
          </span>
          <div>
            <h3 className="font-bold text-white text-base leading-snug">{team.name}</h3>
            <p className="text-xs text-zinc-300">
              {team.players.length} cầu thủ
            </p>
          </div>
        </div>

        {/* Rating Badge */}
        <div className="text-right">
          <div className="flex items-center gap-1 text-amber-400 font-bold text-sm justify-end">
            <Star className="w-4 h-4 fill-amber-400" />
            <span>{team.totalRating} pts</span>
          </div>
          <span className="text-[11px] text-zinc-300">TB: {team.avgRating}/10</span>
        </div>
      </div>

      {/* Position Breakdown Bar */}
      <div className="px-4 py-2 bg-zinc-950/60 border-b border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
        <span className="font-medium text-zinc-300">Đội hình tuyến:</span>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="text-amber-400">{team.gkCount} GK</span>
          <span>•</span>
          <span className="text-blue-400">{team.defCount} DEF</span>
          <span>•</span>
          <span className="text-emerald-400">{team.midCount} MID</span>
          <span>•</span>
          <span className="text-rose-400">{team.fwdCount} FWD</span>
        </div>
      </div>

      {/* Players List */}
      <div className="p-3 space-y-1.5 flex-1 max-h-[380px] overflow-y-auto">
        {team.players.length === 0 ? (
          <div className="py-8 text-center text-zinc-500 text-xs">
            Chưa có cầu thủ nào trong đội này.
          </div>
        ) : (
          team.players.map((player) => {
            const posMeta = POSITION_LABELS[player.position];
            const isSelected = selectedPlayerForSwap?.id === player.id;

            return (
              <div
                key={player.id}
                onClick={() => onSelectPlayerForSwap(player)}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md ring-2 ring-emerald-500/50'
                    : 'bg-zinc-950/80 hover:bg-zinc-800 border-zinc-800/80 hover:border-zinc-700 text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${posMeta.badgeClass}`}
                  >
                    {player.position}
                  </span>
                  <div>
                    <span className="text-sm font-semibold text-white block leading-tight">
                      {player.name}
                    </span>
                    <span className="text-[10px] text-zinc-400">{posMeta.label}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-amber-400 flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{player.rating}</span>
                  </span>

                  <button
                    type="button"
                    title="Bấm để hoán đổi với đội khác"
                    className={`p-1.5 rounded-lg text-xs transition-colors ${
                      isSelected
                        ? 'bg-emerald-500 text-zinc-950 font-bold'
                        : 'text-zinc-500 hover:text-emerald-400 hover:bg-zinc-800'
                    }`}
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

