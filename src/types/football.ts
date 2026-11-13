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
  matchId?: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  venueMapUrl?: string;
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
  pollId?: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  venueMapUrl?: string;
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
  { id: 'p_1', name: 'Hoàng Duyn', position: 'GK', rating: 8, matchesPlayed: 0, goals: 0, assists: 0, wins: 0, draws: 0, losses: 0, mvpCount: 0 },
  { id: 'p_2', name: 'Lê Huy', position: 'GK', rating: 8, matchesPlayed: 0, goals: 0, assists: 0, wins: 0, draws: 0, losses: 0, mvpCount: 0 },
  { id: 'p_3', name: 'Song Toàn', position: 'DEF', rating: 8, matchesPlayed: 0, goals: 0, assists: 0, wins: 0, draws: 0, losses: 0, mvpCount: 0 },
  { id: 'p_4', name: 'Quân Cao', position: 'DEF', rating: 8, matchesPlayed: 0, goals: 0, assists: 0, wins: 0, draws: 0, losses: 0, mvpCount: 0 },
  { id: 'p_5', name: 'Đình Biển', position: 'DEF', rating: 8, matchesPlayed: 0, goals: 0, assists: 0, wins: 0, draws: 0, losses: 0, mvpCount: 0 },
  { id: 'p_6', name: 'Chí Trung', position: 'DEF', rating: 7, matchesPlayed: 0, goals: 0, assists: 0, wins: 0, draws: 0, losses: 0, mvpCount: 0 },
  { id: 'p_7', name: 'Hoàng Phương', position: 'DEF', rating: 7, matchesPlayed: 0, goals: 0, assists: 0, wins: 0, draws: 0, losses: 0, mvpCount: 0 },
  { id: 'p_8', name: 'Thanh Phong', position: 'MID', rating: 8, matchesPlayed: 0, goals: 0, assists: 0, wins: 0, draws: 0, losses: 0, mvpCount: 0 },
  { id: 'p_9', name: 'CP Cường', position: 'MID', rating: 8, matchesPlayed: 0, goals: 0, assists: 0, wins: 0, draws: 0, losses: 0, mvpCount: 0 },
  { id: 'p_10', name: 'Quang Vinh', position: 'MID', rating: 8, matchesPlayed: 0, goals: 0, assists: 0, wins: 0, draws: 0, losses: 0, mvpCount: 0 },
  { id: 'p_11', name: 'Hùng', position: 'MID', rating: 8, matchesPlayed: 0, goals: 0, assists: 0, wins: 0, draws: 0, losses: 0, mvpCount: 0 },
  { id: 'p_12', name: 'Minh Thi', position: 'MID', rating: 8, matchesPlayed: 0, goals: 0, assists: 0, wins: 0, draws: 0, losses: 0, mvpCount: 0 },
  { id: 'p_13', name: 'Khang Bắp', position: 'FWD', rating: 8, matchesPlayed: 0, goals: 0, assists: 0, wins: 0, draws: 0, losses: 0, mvpCount: 0 },
  { id: 'p_14', name: 'Khánh Duy', position: 'FWD', rating: 8, matchesPlayed: 0, goals: 0, assists: 0, wins: 0, draws: 0, losses: 0, mvpCount: 0 },
  { id: 'p_15', name: 'Hoàng Châu', position: 'FWD', rating: 8, matchesPlayed: 0, goals: 0, assists: 0, wins: 0, draws: 0, losses: 0, mvpCount: 0 },
  { id: 'p_16', name: 'Thành', position: 'FWD', rating: 7, matchesPlayed: 0, goals: 0, assists: 0, wins: 0, draws: 0, losses: 0, mvpCount: 0 },
];

export function getGoogleMapsUrl(venue: string, venueMapUrl?: string): string {
  if (venueMapUrl && venueMapUrl.trim().startsWith('http')) {
    return venueMapUrl.trim();
  }
  if (!venue || !venue.trim()) return 'https://www.google.com/maps';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.trim())}`;
}
