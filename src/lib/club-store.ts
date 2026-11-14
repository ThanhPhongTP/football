'use client';

import { useState, useEffect, useCallback } from 'react';
import { Player, Match, INITIAL_ROSTER, GoalEvent, AssistEvent, MatchCost } from '@/types/football';
import { initFirebase } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

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

    // Sync latest roster from Cloud API / Firestore
    fetch('/api/players')
      .then((res) => (res.ok ? res.json() : null))
      .then((cloudPlayers) => {
        if (Array.isArray(cloudPlayers) && cloudPlayers.length > 0) {
          setRoster(cloudPlayers);
          localStorage.setItem(ROSTER_STORAGE_KEY, JSON.stringify(cloudPlayers));
        }
      })
      .catch(() => {});

    let savedMatches: Match[] = [];
    const rawMatches = localStorage.getItem(MATCHES_STORAGE_KEY);
    if (rawMatches) {
      try {
        savedMatches = JSON.parse(rawMatches);
      } catch {
        savedMatches = [];
      }
    }
    setMatches(savedMatches);

    // Sync matches from Cloud API / Firestore
    fetch('/api/matches')
      .then((res) => (res.ok ? res.json() : null))
      .then((cloudMatches) => {
        if (Array.isArray(cloudMatches)) {
          setMatches(cloudMatches);
          localStorage.setItem(MATCHES_STORAGE_KEY, JSON.stringify(cloudMatches));
        }
      })
      .catch(() => {});

    setIsLoaded(true);
  }, []);

  // Save Roster (Local storage + Sync Cloud Firestore)
  const saveRoster = useCallback((newRoster: Player[]) => {
    setRoster(newRoster);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ROSTER_STORAGE_KEY, JSON.stringify(newRoster));
      // Auto-push to API / Cloud Firestore
      fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRoster),
      }).catch((err) => console.warn('Could not sync roster to cloud:', err));
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

  // Upsert Match (Local storage + Cloud Firestore + Server DB API)
  const upsertMatch = useCallback(
    (match: Match) => {
      const withTimestamp: Match = {
        ...match,
        updatedAt: Date.now(),
      };

      setMatches((prev) => {
        const idx = prev.findIndex((m) => m.id === withTimestamp.id);
        const updated = idx >= 0 ? prev.map((m) => (m.id === withTimestamp.id ? withTimestamp : m)) : [withTimestamp, ...prev];
        if (typeof window !== 'undefined') {
          localStorage.setItem(MATCHES_STORAGE_KEY, JSON.stringify(updated));
          localStorage.setItem(`footdraw_match_${withTimestamp.id}`, JSON.stringify(withTimestamp));
        }
        return updated;
      });

      // Push to API & Cloud
      if (typeof window !== 'undefined') {
        fetch(`/api/matches/${withTimestamp.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(withTimestamp),
        }).catch((err) => console.warn('Could not sync match to API:', err));

        // Sync directly to Firestore if available
        const { db } = initFirebase();
        if (db) {
          try {
            const cleanDoc = JSON.parse(JSON.stringify(withTimestamp));
            setDoc(doc(db, 'matches', withTimestamp.id), cleanDoc, { merge: true }).catch((err) =>
              console.warn('Could not sync match to Firestore:', err)
            );
          } catch {
            // ignore
          }
        }
      }
    },
    []
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

      const wasCompleted = targetMatch.status === 'COMPLETED';
      const team1Won = result.score.team1 > result.score.team2;
      const team2Won = result.score.team2 > result.score.team1;
      const isDraw = result.score.team1 === result.score.team2;

      // Update Roster Player Stats
      const updatedRoster = roster.map((player) => {
        // Was this player in team 1 or team 2?
        const inTeam1 = (targetMatch.teams[0]?.players || []).some((p) => p.id === player.id);
        const inTeam2 = (targetMatch.teams[1]?.players || []).some((p) => p.id === player.id);

        if (!inTeam1 && !inTeam2) return player;

        // If previously completed, subtract previous stats for this match first
        const prevGoals = wasCompleted ? (targetMatch.goalEvents || []).filter((g) => g.playerId === player.id).length : 0;
        const prevAssists = wasCompleted ? (targetMatch.assistEvents || []).filter((a) => a.playerId === player.id).length : 0;
        const prevMvp = wasCompleted && targetMatch.mvpPlayerId === player.id ? 1 : 0;

        const prevTeam1Won = (targetMatch.score?.team1 ?? 0) > (targetMatch.score?.team2 ?? 0);
        const prevTeam2Won = (targetMatch.score?.team2 ?? 0) > (targetMatch.score?.team1 ?? 0);
        const prevIsDraw = wasCompleted && (targetMatch.score?.team1 ?? 0) === (targetMatch.score?.team2 ?? 0);
        const prevWon = wasCompleted && ((inTeam1 && prevTeam1Won) || (inTeam2 && prevTeam2Won)) ? 1 : 0;
        const prevLost = wasCompleted && ((inTeam1 && prevTeam2Won) || (inTeam2 && prevTeam1Won)) ? 1 : 0;
        const prevDraw = prevIsDraw ? 1 : 0;

        const playerGoals = result.goalEvents.filter((g) => g.playerId === player.id).length;
        const playerAssists = result.assistEvents.filter((a) => a.playerId === player.id).length;
        const isMvp = result.mvpPlayerId === player.id;

        const won = (inTeam1 && team1Won) || (inTeam2 && team2Won);
        const lost = (inTeam1 && team2Won) || (inTeam2 && team1Won);

        return {
          ...player,
          matchesPlayed: Math.max(0, player.matchesPlayed + (wasCompleted ? 0 : 1)),
          goals: Math.max(0, player.goals - prevGoals + playerGoals),
          assists: Math.max(0, player.assists - prevAssists + playerAssists),
          wins: Math.max(0, player.wins - prevWon + (won ? 1 : 0)),
          losses: Math.max(0, player.losses - prevLost + (lost ? 1 : 0)),
          draws: Math.max(0, player.draws - prevDraw + (isDraw ? 1 : 0)),
          mvpCount: Math.max(0, player.mvpCount - prevMvp + (isMvp ? 1 : 0)),
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
        teams: (targetMatch.teams || []).map((t, idx) => ({
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

