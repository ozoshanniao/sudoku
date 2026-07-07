export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type Screen = 'menu' | 'difficulty-settings' | 'settings' | 'game' | 'daily' | 'stats' | 'profile';

export interface Cell {
  row: number;
  col: number;
  value: number | null;
  solvedValue: number;
  isClue: boolean;
  notes: number[];
  isInvalid: boolean;
}

export interface RecentGame {
  id: string;
  difficulty: Difficulty;
  time: number;
  date: string;
  won: boolean;
  xpEarned: number;
  mistakes: number;
}

export interface Profile {
  username: string;
  xp: number;
  level: number;
  streak: number;
  lastPlayedDate: string | null;
  completedDays: string[]; // dates in YYYY-MM-DD
  avatar: string; // emoji or clean short representation
}

export interface Stats {
  gamesPlayed: number;
  gamesWon: number;
  bestTimes: {
    easy: number | null;
    medium: number | null;
    hard: number | null;
    expert: number | null;
  };
  weeklyActivity: { [day: string]: number }; // e.g. Monday: 2, Tuesday: 4
  recentGames: RecentGame[];
}

export interface GameSettings {
  soundEffects: boolean;
  showTimer: boolean;
  autoCheckMistakes: boolean;
  limitMistakes?: boolean;
}
