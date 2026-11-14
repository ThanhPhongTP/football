import fs from 'fs/promises';
import path from 'path';
import { AttendancePoll, PollVote, Match, Player, INITIAL_ROSTER } from '@/types/football';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { getServerDb } from './firebase';

const DATA_DIR = path.join(process.cwd(), 'data');
const POLLS_FILE = path.join(DATA_DIR, 'polls.json');
const MATCHES_FILE = path.join(DATA_DIR, 'matches.json');
const ROSTER_FILE = path.join(DATA_DIR, 'roster.json');

// Memory cache fallback
let memoryPolls: AttendancePoll[] = [];
let memoryMatches: Match[] = [];
let memoryRoster: Player[] = [...INITIAL_ROSTER];
let isInitialized = false;

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

async function readFileSafe<T>(filePath: string, fallback: T): Promise<T> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch {
    return fallback;
  }
}

async function writeFileSafe<T>(filePath: string, data: T): Promise<void> {
  try {
    await ensureDataDir();
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.warn(`Could not write to ${filePath}:`, error);
  }
}

// Initialize default sample data if empty
async function initDefaultData() {
  if (isInitialized) return;
  isInitialized = true;

  const existingRoster = await readFileSafe<Player[]>(ROSTER_FILE, []);
  if (existingRoster.length === 0) {
    await writeFileSafe(ROSTER_FILE, INITIAL_ROSTER);
    memoryRoster = [...INITIAL_ROSTER];
  } else {
    memoryRoster = existingRoster;
  }

  const existingPolls = await readFileSafe<AttendancePoll[]>(POLLS_FILE, []);
  memoryPolls = existingPolls;
}

// --- POLLS API ---
export async function getPolls(): Promise<AttendancePoll[]> {
  const db = getServerDb();
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'polls'));
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data() as AttendancePoll);
        return list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      }
      return [];
    } catch (err) {
      console.warn('Firestore getPolls error, falling back to local:', err);
    }
  }

  await initDefaultData();
  const fileData = await readFileSafe<AttendancePoll[]>(POLLS_FILE, memoryPolls);
  memoryPolls = fileData;
  return memoryPolls;
}

export async function getPollById(id: string): Promise<AttendancePoll | null> {
  const db = getServerDb();
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'polls', id));
      if (snap.exists()) {
        return snap.data() as AttendancePoll;
      }
    } catch (err) {
      console.warn('Firestore getPollById error:', err);
    }
  }

  const polls = await getPolls();
  return polls.find((p) => p.id === id) || null;
}

export async function savePoll(poll: AttendancePoll): Promise<AttendancePoll> {
  const updatedPoll: AttendancePoll = {
    ...poll,
    updatedAt: Date.now(),
  };

  const db = getServerDb();
  if (db) {
    try {
      const cleanData = JSON.parse(JSON.stringify(updatedPoll));
      await setDoc(doc(db, 'polls', updatedPoll.id), cleanData);
    } catch (err) {
      console.warn('Firestore savePoll error:', err);
    }
  }

  const polls = await readFileSafe<AttendancePoll[]>(POLLS_FILE, memoryPolls);
  const idx = polls.findIndex((p) => p.id === poll.id);
  if (idx >= 0) {
    polls[idx] = updatedPoll;
  } else {
    polls.unshift(updatedPoll);
  }

  memoryPolls = polls;
  await writeFileSafe(POLLS_FILE, polls);

  if (updatedPoll.matchId) {
    try {
      const match = await getMatchById(updatedPoll.matchId);
      if (match && match.pollId !== updatedPoll.id) {
        await saveMatch({
          ...match,
          pollId: updatedPoll.id,
        });
      }
    } catch (err) {
      console.warn('Link poll to match error:', err);
    }
  }

  return updatedPoll;
}

export async function deletePoll(id: string): Promise<boolean> {
  const db = getServerDb();
  if (db) {
    try {
      await deleteDoc(doc(db, 'polls', id));
    } catch (err) {
      console.warn('Firestore deletePoll error:', err);
    }
  }

  const polls = await readFileSafe<AttendancePoll[]>(POLLS_FILE, memoryPolls);
  const filtered = polls.filter((p) => p.id !== id);
  memoryPolls = filtered;
  await writeFileSafe(POLLS_FILE, filtered);

  // Unlink from any match that references this pollId
  try {
    const matches = await getMatches();
    const linked = matches.find((m) => m.pollId === id);
    if (linked) {
      await saveMatch({
        ...linked,
        pollId: undefined,
      });
    }
  } catch (err) {
    console.warn('Unlink deleted poll from match error:', err);
  }

  return true;
}

export async function castPollVote(
  pollId: string,
  voteInput: {
    playerName: string;
    status: 'YES' | 'NO' | 'MAYBE';
    playerId?: string;
    position?: Player['position'];
    rating?: number;
  }
): Promise<AttendancePoll | null> {
  const poll = await getPollById(pollId);
  if (!poll) return null;

  const trimmedName = voteInput.playerName.trim();
  const roster = await getRoster();
  const matchedRosterPlayer = roster.find(
    (p) => p.name.trim().toLowerCase() === trimmedName.toLowerCase()
  );

  const position = voteInput.position || matchedRosterPlayer?.position || 'MID';
  const rating = voteInput.rating || matchedRosterPlayer?.rating || 7;
  const playerId = voteInput.playerId || matchedRosterPlayer?.id;

  const existingVoteIndex = poll.votes.findIndex(
    (v) => v.playerName.trim().toLowerCase() === trimmedName.toLowerCase()
  );

  const updatedVotes = [...poll.votes];
  const newVote: PollVote = {
    id: existingVoteIndex >= 0 ? poll.votes[existingVoteIndex].id : `v_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    playerName: trimmedName,
    playerId,
    status: voteInput.status,
    position,
    rating,
    updatedAt: Date.now(),
  };

  if (existingVoteIndex >= 0) {
    updatedVotes[existingVoteIndex] = newVote;
  } else {
    updatedVotes.push(newVote);
  }

  const updatedPoll: AttendancePoll = {
    ...poll,
    votes: updatedVotes,
    updatedAt: Date.now(),
  };

  const saved = await savePoll(updatedPoll);

  // Sync vote status directly to linked match if matchId is present
  if (poll.matchId) {
    try {
      const match = await getMatchById(poll.matchId);
      if (match) {
        let matchPlayers = [...(match.players || [])];
        const matchIdx = matchPlayers.findIndex(
          (p) => (playerId && p.id === playerId) || p.name.trim().toLowerCase() === trimmedName.toLowerCase()
        );
        const targetStatus: 'IN' | 'OUT' = voteInput.status === 'YES' ? 'IN' : 'OUT';
        if (matchIdx >= 0) {
          matchPlayers[matchIdx] = {
            ...matchPlayers[matchIdx],
            status: targetStatus,
          };
        } else {
          matchPlayers.push({
            id: playerId || `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: trimmedName,
            position: position as Player['position'],
            rating,
            status: targetStatus,
            isGuest: !matchedRosterPlayer,
            matchesPlayed: 1,
            goals: 0,
            assists: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            mvpCount: 0,
          });
        }
        await saveMatch({
          ...match,
          players: matchPlayers,
          updatedAt: Date.now(),
        });
      }
    } catch (err) {
      console.warn('Sync poll vote to match error:', err);
    }
  }

  return saved;
}

// --- ROSTER API ---
export async function getRoster(): Promise<Player[]> {
  const db = getServerDb();
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'roster'));
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as Player);
      }
      // If collection empty in firestore, seed default roster
      await initDefaultData();
      if (memoryRoster.length > 0) {
        for (const player of memoryRoster) {
          await setDoc(doc(db, 'roster', player.id), player);
        }
        return memoryRoster;
      }
    } catch (err) {
      console.warn('Firestore getRoster error:', err);
    }
  }

  await initDefaultData();
  const fileData = await readFileSafe<Player[]>(ROSTER_FILE, memoryRoster);
  memoryRoster = fileData;
  return memoryRoster;
}

export async function saveRoster(roster: Player[]): Promise<Player[]> {
  const db = getServerDb();
  if (db) {
    try {
      for (const p of roster) {
        await setDoc(doc(db, 'roster', p.id), p);
      }
    } catch (err) {
      console.warn('Firestore saveRoster error:', err);
    }
  }

  memoryRoster = roster;
  await writeFileSafe(ROSTER_FILE, roster);
  return roster;
}

// --- MATCHES API ---
export async function getMatches(): Promise<Match[]> {
  const db = getServerDb();
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'matches'));
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data() as Match);
        return list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      }
    } catch (err) {
      console.warn('Firestore getMatches error:', err);
    }
  }

  await initDefaultData();
  const fileData = await readFileSafe<Match[]>(MATCHES_FILE, memoryMatches);
  memoryMatches = fileData;
  return memoryMatches;
}

export async function getMatchById(id: string): Promise<Match | null> {
  const db = getServerDb();
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'matches', id));
      if (snap.exists()) {
        const matchData = snap.data() as Match;
        if (!matchData.players || matchData.players.length === 0) {
          const roster = await getRoster();
          matchData.players = roster.map((p) => ({ ...p, status: 'OUT' }));
          await setDoc(doc(db, 'matches', id), matchData);
        }
        return matchData;
      }
    } catch (err) {
      console.warn('Firestore getMatchById error:', err);
    }
  }

  const matches = await getMatches();
  const found = matches.find((m) => m.id === id);
  if (found) {
    if (!found.players || found.players.length === 0) {
      const roster = await getRoster();
      found.players = roster.map((p) => ({ ...p, status: 'OUT' }));
      await saveMatch(found);
    }
    return found;
  }
  return null;
}

export async function saveMatch(match: Match): Promise<Match> {
  let cleanedTeams = match.teams || [];
  let isDrawn = match.isDrawn;

  if (cleanedTeams.length > 0 && match.players) {
    const activeIds = new Set(
      match.players.filter((p) => p.status === 'IN').map((p) => p.id)
    );
    const activeNames = new Set(
      match.players.filter((p) => p.status === 'IN').map((p) => p.name.trim().toLowerCase())
    );

    cleanedTeams = cleanedTeams.map((team) => {
      const validPlayers = team.players.filter(
        (p) => activeIds.has(p.id) || activeNames.has(p.name.trim().toLowerCase())
      );
      const totalRating = validPlayers.reduce((sum, p) => sum + p.rating, 0);
      const avgRating = validPlayers.length > 0 ? Number((totalRating / validPlayers.length).toFixed(1)) : 0;
      return {
        ...team,
        players: validPlayers,
        totalRating,
        avgRating,
        gkCount: validPlayers.filter((p) => p.position === 'GK').length,
        defCount: validPlayers.filter((p) => p.position === 'DEF').length,
        midCount: validPlayers.filter((p) => p.position === 'MID').length,
        fwdCount: validPlayers.filter((p) => p.position === 'FWD').length,
      };
    });

    const totalInTeams = cleanedTeams.reduce((sum, t) => sum + t.players.length, 0);
    if (totalInTeams === 0) {
      cleanedTeams = [];
      isDrawn = false;
    }
  }

  const updatedMatch: Match = {
    ...match,
    teams: cleanedTeams,
    isDrawn: cleanedTeams.length > 0 ? isDrawn : false,
    updatedAt: Date.now(),
  };

  const db = getServerDb();
  if (db) {
    try {
      const cleanData = JSON.parse(JSON.stringify(updatedMatch));
      await setDoc(doc(db, 'matches', updatedMatch.id), cleanData);
    } catch (err) {
      console.warn('Firestore saveMatch error:', err);
    }
  }

  const matches = await readFileSafe<Match[]>(MATCHES_FILE, memoryMatches);
  const idx = matches.findIndex((m) => m.id === match.id);
  if (idx >= 0) {
    matches[idx] = updatedMatch;
  } else {
    matches.unshift(updatedMatch);
  }

  memoryMatches = matches;
  await writeFileSafe(MATCHES_FILE, matches);
  return updatedMatch;
}

