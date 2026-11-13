import { useEffect, useState, useCallback, useRef } from 'react';
import { Match } from '@/types/football';
import { initFirebase } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export function useMatchSync(matchId: string, initialMatch?: Match | null) {
  const [match, setMatch] = useState<Match | null>(initialMatch || null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCloudEnabled, setIsCloudEnabled] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number>(0);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Load from local storage or API on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Try BroadcastChannel for cross-tab realtime sync
    try {
      const channel = new BroadcastChannel(`footdraw_match_${matchId}`);
      channelRef.current = channel;
      channel.onmessage = (event) => {
        if (event.data && event.data.id === matchId) {
          setMatch(event.data);
          setLastUpdated(Date.now());
        }
      };
    } catch {
      // BroadcastChannel might not be supported in older environments
    }

    // 2. Try Firebase Firestore if configured
    const { db } = initFirebase();
    let unsubscribeFirestore: (() => void) | null = null;

    if (db) {
      setIsCloudEnabled(true);
      const matchDocRef = doc(db, 'matches', matchId);
      unsubscribeFirestore = onSnapshot(
        matchDocRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as Match;
            setMatch(data);
            setLastUpdated(Date.now());
            // save local backup
            localStorage.setItem(`footdraw_match_${matchId}`, JSON.stringify(data));
          }
        },
        (error) => {
          console.warn('Firestore onSnapshot error:', error);
          setIsCloudEnabled(false);
        }
      );
    } else {
      setIsCloudEnabled(false);
      // Read from local storage
      let foundMatch: Match | null = null;
      const localData = localStorage.getItem(`footdraw_match_${matchId}`);
      if (localData) {
        try {
          foundMatch = JSON.parse(localData);
        } catch {
          // ignore error
        }
      }

      if (!foundMatch) {
        const clubMatchesRaw = localStorage.getItem('footdraw_club_matches');
        if (clubMatchesRaw) {
          try {
            const list: Match[] = JSON.parse(clubMatchesRaw);
            const m = list.find((item) => item.id === matchId);
            if (m) foundMatch = m;
          } catch {
            // ignore
          }
        }
      }

      if (foundMatch) {
        setMatch(foundMatch);
      }

      // Try fetching from internal Next.js API
      fetch(`/api/matches/${matchId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.id === matchId) {
            setMatch((prev) => {
              if (!prev || (data.updatedAt && data.updatedAt > (prev.updatedAt || 0))) {
                return data;
              }
              return prev;
            });
          }
        })
        .catch(() => {});

      // Fallback: If after 1 second match is still null, generate a clean default match
      const fallbackTimer = setTimeout(() => {
        setMatch((prev) => {
          if (prev) return prev;
          const freshMatch: Match = {
            id: matchId,
            title: `Trận đấu phòng #${matchId.substring(0, 8)}`,
            date: new Date().toISOString().split('T')[0],
            time: '20:00 - 21:30',
            venue: 'Sân bóng phủi',
            format: '7v7',
            targetPlayers: 14,
            numberOfTeams: 2,
            status: 'SCHEDULED',
            players: [],
            teams: [],
            isDrawn: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          return freshMatch;
        });
      }, 1200);

      return () => clearTimeout(fallbackTimer);
    }

    return () => {
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
      if (channelRef.current) {
        channelRef.current.close();
      }
    };
  }, [matchId]);

  // Method to push updates
  const saveMatch = useCallback(
    async (updatedMatch: Match) => {
      setIsSyncing(true);
      const withTimestamp: Match = {
        ...updatedMatch,
        updatedAt: Date.now(),
      };

      // Optimistic local update
      setMatch(withTimestamp);
      setLastUpdated(Date.now());

      if (typeof window !== 'undefined') {
        // Save to local storage
        localStorage.setItem(`footdraw_match_${matchId}`, JSON.stringify(withTimestamp));

        // Save to club matches list
        try {
          const clubMatchesRaw = localStorage.getItem('footdraw_club_matches');
          let clubMatches: Match[] = clubMatchesRaw ? JSON.parse(clubMatchesRaw) : [];
          const idx = clubMatches.findIndex((m) => m.id === matchId);
          if (idx >= 0) {
            clubMatches[idx] = withTimestamp;
          } else {
            clubMatches.unshift(withTimestamp);
          }
          localStorage.setItem('footdraw_club_matches', JSON.stringify(clubMatches));
        } catch {
          // ignore
        }

        // Save to recent matches list
        try {
          const recentKey = 'footdraw_recent_matches';
          const recentRaw = localStorage.getItem(recentKey);
          let recent: { id: string; title: string; date: string; time: string; updatedAt: number }[] = recentRaw ? JSON.parse(recentRaw) : [];
          recent = recent.filter((r) => r.id !== matchId);
          recent.unshift({
            id: matchId,
            title: withTimestamp.title,
            date: withTimestamp.date,
            time: withTimestamp.time,
            updatedAt: Date.now(),
          });
          localStorage.setItem(recentKey, JSON.stringify(recent.slice(0, 10)));
        } catch {
          // ignore
        }

        // Broadcast to other tabs
        if (channelRef.current) {
          channelRef.current.postMessage(withTimestamp);
        }
      }

      // Sync to Firebase if available
      const { db } = initFirebase();
      if (db) {
        try {
          const matchDocRef = doc(db, 'matches', matchId);
          await setDoc(matchDocRef, withTimestamp, { merge: true });
        } catch (err) {
          console.error('Failed to sync to Firestore:', err);
        }
      }

      // Also sync to local Next.js API
      try {
        await fetch(`/api/matches/${matchId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(withTimestamp),
        });
      } catch {
        // ignore offline fetch error
      }

      setIsSyncing(false);
    },
    [matchId]
  );

  return { match, saveMatch, isSyncing, isCloudEnabled, lastUpdated };
}
