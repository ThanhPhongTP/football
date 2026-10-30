'use client';

import { useState, useEffect, useCallback } from 'react';
import { Player, Match, INITIAL_ROSTER, GoalEvent, AssistEvent, MatchCost } from '@/types/football';

const ROSTER_STORAGE_KEY = 'footdraw_club_roster';
const MATCHES_STORAGE_KEY = 'footdraw_club_matches';

export function useClubStore() {
  const [roster, setRoster] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize from LocalStorage or default presets
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let savedRoster: Player[] = [];
    const rawRoster = localStorage.getItem(ROSTER_STORAGE_KEY);
    if (rawRoster) {
      try {
        savedRoster = JSON.parse(rawRoster);
      } catch {
        savedRoster = INITIAL_ROSTER;
      }
    } else {
      savedRoster = INITIAL_ROSTER;
      localStorage.setItem(ROSTER_STORAGE_KEY, JSON.stringify(savedRoster));
    }
    setRoster(savedRoster);

    let savedMatches: Match[] = [];
    const rawMatches = localStorage.getItem(MATCHES_STORAGE_KEY);
    if (rawMatches) {
      try {
        savedMatches = JSON.parse(rawMatches);
      } catch {
        savedMatches = [];
      }
    } else {
      // Default sample matches for demo
      savedMatches = [
        {
          id: 'match_sample_past',
          title: 'Nội chiến Tuần 42 - Derby Anh Em',
          date: '2026-10-22',
          time: '20:00 - 21:30',
          venue: 'Sân Chuyên Việt (Q7)',
          format: '7v7',
          targetPlayers: 14,
          numberOfTeams: 2,
          notes: 'Trận cầu đỉnh cao, mưa nhẹ',
          status: 'COMPLETED',
          isDrawn: true,
          players: savedRoster.slice(0, 14).map((p) => ({ ...p, status: 'IN' as const })),
          teams: [
            {
              id: 1,
              name: 'Đội Cam (Orange)',
              colorName: 'Cam',
              bgGradient: 'from-orange-500/20 via-orange-950/40 to-zinc-900',
              badgeBg: 'bg-orange-500 text-white',
              textColor: 'text-orange-400',
              players: savedRoster.slice(0, 7),
              totalRating: 58,
              avgRating: 8.3,
              gkCount: 1,
              defCount: 3,
              midCount: 2,
              fwdCount: 1,
              score: 4,
            },
            {
              id: 2,
              name: 'Đội Xanh (Blue)',
              colorName: 'Xanh dương',
              bgGradient: 'from-blue-500/20 via-blue-950/40 to-zinc-900',
              badgeBg: 'bg-blue-600 text-white',
              textColor: 'text-blue-400',
              players: savedRoster.slice(7, 14),
              totalRating: 57,
              avgRating: 8.1,
              gkCount: 1,
              defCount: 2,
              midCount: 2,
              fwdCount: 2,
              score: 3,
            },
          ],
          score: { team1: 4, team2: 3 },
          mvpPlayerId: 'p_8', // Quang Hải
          goalEvents: [
            { id: 'g1', playerId: 'p_12', playerName: 'Tiến Linh', teamId: 1, minute: 12 },
            { id: 'g2', playerId: 'p_8', playerName: 'Quang Hải', teamId: 1, minute: 25 },
            { id: 'g3', playerId: 'p_8', playerName: 'Quang Hải', teamId: 1, minute: 50 },
            { id: 'g4', playerId: 'p_12', playerName: 'Tiến Linh', teamId: 1, minute: 75 },
            { id: 'g5', playerId: 'p_13', playerName: 'Tuấn Hải', teamId: 2, minute: 18 },
            { id: 'g6', playerId: 'p_10', playerName: 'Hoàng Đức', teamId: 2, minute: 40 },
            { id: 'g7', playerId: 'p_13', playerName: 'Tuấn Hải', teamId: 2, minute: 68 },
          ],
          assistEvents: [
            { id: 'a1', playerId: 'p_9', playerName: 'Hùng Dũng', teamId: 1 },
            { id: 'a2', playerId: 'p_10', playerName: 'Hoàng Đức', teamId: 2 },
          ],
          cost: {
            pitchFee: 700000,
            waterFee: 140000,
            otherFee: 0,
            total: 840000,
            costPerPlayer: 60000,
            bankName: 'MB Bank',
            bankAccount: '0987654321',
            accountHolder: 'NGUYEN VAN LONG',
          },
          createdAt: Date.now() - 86400000 * 7,
          updatedAt: Date.now() - 86400000 * 7,
        },
      ];
      localStorage.setItem(MATCHES_STORAGE_KEY, JSON.stringify(savedMatches));
    }
    setMatches(savedMatches);
    setIsLoaded(true);
  }, []);

  // Save Roster
  const saveRoster = useCallback((newRoster: Player[]) => {
    setRoster(newRoster);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ROSTER_STORAGE_KEY, JSON.stringify(newRoster));
    }
  }, []);

  // Save Matches
  const saveMatches = useCallback((newMatches: Match[]) => {
    setMatches(newMatches);
    if (typeof window !== 'undefined') {
      localStorage.setItem(MATCHES_STORAGE_KEY, JSON.stringify(newMatches));
    }
  }, []);

  // Add / Edit Player in Roster
  const upsertPlayer = useCallback(
    (player: Player) => {
      const idx = roster.findIndex((p) => p.id === player.id);
      let updated: Player[];
      if (idx >= 0) {
        updated = roster.map((p) => (p.id === player.id ? player : p));
      } else {
        updated = [...roster, player];
      }
      saveRoster(updated);
    },
    [roster, saveRoster]
  );

  // Delete Player from Roster
  const deletePlayer = useCallback(
    (playerId: string) => {
      const updated = roster.filter((p) => p.id !== playerId);
      saveRoster(updated);
    },
    [roster, saveRoster]
  );

  // Upsert Match
  const upsertMatch = useCallback(
    (match: Match) => {
      const idx = matches.findIndex((m) => m.id === match.id);
      let updated: Match[];
      if (idx >= 0) {
        updated = matches.map((m) => (m.id === match.id ? match : m));
      } else {
        updated = [match, ...matches];
      }
      saveMatches(updated);
    },
    [matches, saveMatches]
  );

  // Record Result of a finished Match & Update Player Statistics
  const recordMatchResult = useCallback(
    (
      matchId: string,
      result: {
        score: { team1: number; team2: number; team3?: number };
        goalEvents: GoalEvent[];
        assistEvents: AssistEvent[];
        mvpPlayerId?: string;
        cost?: MatchCost;
      }
    ) => {
      const targetMatch = matches.find((m) => m.id === matchId);
      if (!targetMatch) return;

      const team1Won = result.score.team1 > result.score.team2;
      const team2Won = result.score.team2 > result.score.team1;
      const isDraw = result.score.team1 === result.score.team2;

      // Update Roster Player Stats
      const updatedRoster = roster.map((player) => {
        // Was this player in team 1 or team 2?
        const inTeam1 = targetMatch.teams[0]?.players.some((p) => p.id === player.id);
        const inTeam2 = targetMatch.teams[1]?.players.some((p) => p.id === player.id);

        if (!inTeam1 && !inTeam2) return player;

        const playerGoals = result.goalEvents.filter((g) => g.playerId === player.id).length;
        const playerAssists = result.assistEvents.filter((a) => a.playerId === player.id).length;
        const isMvp = result.mvpPlayerId === player.id;

        const won = (inTeam1 && team1Won) || (inTeam2 && team2Won);
        const lost = (inTeam1 && team2Won) || (inTeam2 && team1Won);

        return {
          ...player,
          matchesPlayed: player.matchesPlayed + 1,
          goals: player.goals + playerGoals,
          assists: player.assists + playerAssists,
          wins: player.wins + (won ? 1 : 0),
          losses: player.losses + (lost ? 1 : 0),
          draws: player.draws + (isDraw ? 1 : 0),
          mvpCount: player.mvpCount + (isMvp ? 1 : 0),
        };
      });

      saveRoster(updatedRoster);

      // Update Match Object
      const updatedMatch: Match = {
        ...targetMatch,
        status: 'COMPLETED',
        score: result.score,
        goalEvents: result.goalEvents,
        assistEvents: result.assistEvents,
        mvpPlayerId: result.mvpPlayerId,
        cost: result.cost,
        teams: targetMatch.teams.map((t, idx) => ({
          ...t,
          score: idx === 0 ? result.score.team1 : idx === 1 ? result.score.team2 : result.score.team3 || 0,
        })),
        updatedAt: Date.now(),
      };

      upsertMatch(updatedMatch);
    },
    [matches, roster, saveRoster, upsertMatch]
  );

  return {
    roster,
    matches,
    isLoaded,
    saveRoster,
    upsertPlayer,
    deletePlayer,
    saveMatches,
    upsertMatch,
    recordMatchResult,
  };
}

