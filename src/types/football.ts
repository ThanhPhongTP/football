export type Position = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface Player {
  id: string;
  name: string;
  position: Position;
  rating: number; // 1 to 10 points
  matchesPlayed: number;
  goals: number;
  assists: number;
  wins: number;
  draws: number;
  losses: number;
  mvpCount: number;
  status?: 'IN' | 'OUT' | 'PENDING';
  phone?: string;
  avatar?: string;
  isGuest?: boolean;
}

export type NewPlayerInput = {
  id?: string;
  name: string;
  position: Position;
  rating: number;
  status?: 'IN' | 'OUT' | 'PENDING';
  phone?: string;
  isGuest?: boolean;
  matchesPlayed?: number;
  goals?: number;
  assists?: number;
  wins?: number;
  draws?: number;
  losses?: number;
  mvpCount?: number;
};

export interface GoalEvent {
  id: string;
  playerId: string;
  playerName: string;
  teamId: number;
  minute?: number;
}

export interface AssistEvent {
  id: string;
  playerId: string;
  playerName: string;
  teamId: number;
}

export interface MatchCost {
  pitchFee: number;
  waterFee: number;
  otherFee: number;
  total: number;
  costPerPlayer: number;
  bankName?: string;
  bankAccount?: string;
  accountHolder?: string;
}

export interface PollVote {
  id: string;
  playerName: string;
  playerId?: string;
  status: 'YES' | 'NO' | 'MAYBE';
  position?: Position;
  rating?: number;
  updatedAt: number;
}

export interface AttendancePoll {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  format: '5v5' | '7v7' | '11v11';
  targetPlayers: number;
  notes?: string;
  status: 'OPEN' | 'CLOSED';
  votes: PollVote[];
  createdAt: number;
  updatedAt: number;
}

export interface Team {
  id: number;
  name: string;
  colorName: string;
  bgGradient: string;
  badgeBg: string;
  textColor: string;
  players: Player[];
  totalRating: number;
  avgRating: number;
  gkCount: number;
  defCount: number;
  midCount: number;
  fwdCount: number;
  score?: number;
}

export interface Match {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  format: '5v5' | '7v7' | '11v11';
  targetPlayers: number;
  numberOfTeams: 2 | 3 | 4;
  notes?: string;
  status: 'SCHEDULED' | 'DRAWN' | 'COMPLETED';
  players: Player[];
  teams: Team[];
  isDrawn: boolean;
  score?: {
    team1: number;
    team2: number;
    team3?: number;
  };
  goalEvents?: GoalEvent[];
  assistEvents?: AssistEvent[];
  mvpPlayerId?: string;
  cost?: MatchCost;
  createdAt: number;
  updatedAt: number;
}

export const POSITION_LABELS: Record<Position, { label: string; short: string; color: string; badgeClass: string }> = {
  GK: { label: 'Thủ môn', short: 'GK', color: '#f59e0b', badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  DEF: { label: 'Hậu vệ', short: 'DEF', color: '#3b82f6', badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  MID: { label: 'Tiền vệ', short: 'MID', color: '#10b981', badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  FWD: { label: 'Tiền đạo', short: 'FWD', color: '#ef4444', badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
};

export const TEAM_PRESETS = [
  {
    name: 'Đội Cam (Orange)',
    colorName: 'Cam',
    bgGradient: 'from-orange-500/20 via-orange-950/40 to-zinc-900',
    badgeBg: 'bg-orange-500 text-white',
    textColor: 'text-orange-400',
  },
  {
    name: 'Đội Xanh (Blue)',
    colorName: 'Xanh dương',
    bgGradient: 'from-blue-500/20 via-blue-950/40 to-zinc-900',
    badgeBg: 'bg-blue-600 text-white',
    textColor: 'text-blue-400',
  },
  {
    name: 'Đội Đỏ (Red)',
    colorName: 'Đỏ',
    bgGradient: 'from-rose-500/20 via-rose-950/40 to-zinc-900',
    badgeBg: 'bg-rose-600 text-white',
    textColor: 'text-rose-400',
  },
  {
    name: 'Đội Vàng (Yellow)',
    colorName: 'Vàng',
    bgGradient: 'from-amber-500/20 via-amber-950/40 to-zinc-900',
    badgeBg: 'bg-amber-500 text-black',
    textColor: 'text-amber-400',
  },
];

export const INITIAL_ROSTER: Player[] = [
  { id: 'p_1', name: 'Hoàng Long', position: 'GK', rating: 9, matchesPlayed: 18, goals: 0, assists: 2, wins: 11, draws: 3, losses: 4, mvpCount: 2 },
  { id: 'p_2', name: 'Đặng Văn Lâm', position: 'GK', rating: 9, matchesPlayed: 14, goals: 0, assists: 1, wins: 9, draws: 2, losses: 3, mvpCount: 1 },
  { id: 'p_3', name: 'Minh Tuấn', position: 'DEF', rating: 8, matchesPlayed: 20, goals: 3, assists: 5, wins: 12, draws: 4, losses: 4, mvpCount: 1 },
  { id: 'p_4', name: 'Quế Ngọc Hải', position: 'DEF', rating: 9, matchesPlayed: 22, goals: 5, assists: 7, wins: 14, draws: 3, losses: 5, mvpCount: 3 },
  { id: 'p_5', name: 'Văn Đức', position: 'DEF', rating: 7, matchesPlayed: 16, goals: 2, assists: 4, wins: 9, draws: 3, losses: 4, mvpCount: 0 },
  { id: 'p_6', name: 'Thành Chung', position: 'DEF', rating: 8, matchesPlayed: 19, goals: 4, assists: 2, wins: 11, draws: 4, losses: 4, mvpCount: 1 },
  { id: 'p_7', name: 'Bùi Tiến Dũng', position: 'DEF', rating: 8, matchesPlayed: 17, goals: 2, assists: 3, wins: 10, draws: 3, losses: 4, mvpCount: 0 },
  { id: 'p_8', name: 'Quang Hải', position: 'MID', rating: 10, matchesPlayed: 23, goals: 18, assists: 16, wins: 16, draws: 3, losses: 4, mvpCount: 6 },
  { id: 'p_9', name: 'Hùng Dũng', position: 'MID', rating: 9, matchesPlayed: 21, goals: 9, assists: 14, wins: 13, draws: 4, losses: 4, mvpCount: 3 },
  { id: 'p_10', name: 'Hoàng Đức', position: 'MID', rating: 10, matchesPlayed: 22, goals: 15, assists: 17, wins: 15, draws: 3, losses: 4, mvpCount: 5 },
  { id: 'p_11', name: 'Tuấn Anh', position: 'MID', rating: 8, matchesPlayed: 15, goals: 4, assists: 8, wins: 8, draws: 3, losses: 4, mvpCount: 1 },
  { id: 'p_12', name: 'Tiến Linh', position: 'FWD', rating: 9, matchesPlayed: 24, goals: 25, assists: 8, wins: 15, draws: 4, losses: 5, mvpCount: 5 },
  { id: 'p_13', name: 'Tuấn Hải', position: 'FWD', rating: 9, matchesPlayed: 22, goals: 21, assists: 9, wins: 14, draws: 4, losses: 4, mvpCount: 4 },
  { id: 'p_14', name: 'Công Phượng', position: 'FWD', rating: 8, matchesPlayed: 20, goals: 14, assists: 11, wins: 12, draws: 3, losses: 5, mvpCount: 2 },
  { id: 'p_15', name: 'Văn Toàn', position: 'FWD', rating: 8, matchesPlayed: 19, goals: 12, assists: 10, wins: 11, draws: 3, losses: 5, mvpCount: 2 },
];
