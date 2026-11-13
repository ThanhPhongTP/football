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
  if (existingPolls.length === 0) {
    const defaultPoll: AttendancePoll = {
      id: 'poll-derby-thu-5',
      title: 'Trận Bóng Tuần 46 - FC Anh Em',
      date: '2026-11-19',
      time: '20:00 - 21:30',
      venue: 'Sân Chuyên Việt (Quận 7)',
      format: '7v7',
      targetPlayers: 14,
      notes: 'Anh em mang 2 áo (Cam & Xanh). Đến trước 15p khởi động nhé!',
      status: 'OPEN',
      votes: [
        { id: 'v_1', playerName: 'Quang Hải', playerId: 'p_8', status: 'YES', position: 'MID', rating: 10, updatedAt: Date.now() - 3600000 },
        { id: 'v_2', playerName: 'Hoàng Đức', playerId: 'p_10', status: 'YES', position: 'MID', rating: 10, updatedAt: Date.now() - 3000000 },
        { id: 'v_3', playerName: 'Tiến Linh', playerId: 'p_12', status: 'YES', position: 'FWD', rating: 9, updatedAt: Date.now() - 2500000 },
        { id: 'v_4', playerName: 'Tuấn Hải', playerId: 'p_13', status: 'YES', position: 'FWD', rating: 9, updatedAt: Date.now() - 2000000 },
        { id: 'v_5', playerName: 'Hùng Dũng', playerId: 'p_9', status: 'YES', position: 'MID', rating: 9, updatedAt: Date.now() - 1800000 },
        { id: 'v_6', playerName: 'Quế Ngọc Hải', playerId: 'p_4', status: 'YES', position: 'DEF', rating: 9, updatedAt: Date.now() - 1500000 },
        { id: 'v_7', playerName: 'Bùi Tiến Dũng', playerId: 'p_7', status: 'YES', position: 'DEF', rating: 8, updatedAt: Date.now() - 1200000 },
        { id: 'v_8', playerName: 'Đặng Văn Lâm', playerId: 'p_2', status: 'YES', position: 'GK', rating: 9, updatedAt: Date.now() - 1000000 },
        { id: 'v_9', playerName: 'Thành Chung', playerId: 'p_6', status: 'YES', position: 'DEF', rating: 8, updatedAt: Date.now() - 800000 },
        { id: 'v_10', playerName: 'Công Phượng', playerId: 'p_14', status: 'NO', position: 'FWD', rating: 8, updatedAt: Date.now() - 600000 },
      ],
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now(),
    };
    await writeFileSafe(POLLS_FILE, [defaultPoll]);
    memoryPolls = [defaultPoll];
  } else {
    memoryPolls = existingPolls;
  }
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
      // If Firestore is empty, seed default poll
      await initDefaultData();
      if (memoryPolls.length > 0) {
        for (const p of memoryPolls) {
          await setDoc(doc(db, 'polls', p.id), p);
        }
        return memoryPolls;
      }
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
      await setDoc(doc(db, 'polls', updatedPoll.id), updatedPoll);
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
  if (filtered.length !== polls.length) {
    memoryPolls = filtered;
    await writeFileSafe(POLLS_FILE, filtered);
    return true;
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

  return savePoll(updatedPoll);
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
        return snap.data() as Match;
      }
    } catch (err) {
      console.warn('Firestore getMatchById error:', err);
    }
  }

  const matches = await getMatches();
  return matches.find((m) => m.id === id) || null;
}

export async function saveMatch(match: Match): Promise<Match> {
  const updatedMatch: Match = {
    ...match,
    updatedAt: Date.now(),
  };

  const db = getServerDb();
  if (db) {
    try {
      await setDoc(doc(db, 'matches', updatedMatch.id), updatedMatch);
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

