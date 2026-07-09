import { GameSettings, Profile, Stats, Difficulty, RecentGame, Cell } from '../types';

export interface Autosave {
  board: Cell[][];
  difficulty: Difficulty;
  mistakes: number;
  time: number;
}

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function asFiniteNumber(val: unknown, fallback: number): number {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  return fallback;
}

function asBoolean(val: unknown, fallback: boolean): boolean {
  if (typeof val === 'boolean') return val;
  return fallback;
}

function asString(val: unknown, fallback: string): string {
  if (typeof val === 'string') return val;
  return fallback;
}

const VALID_DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

export function normalizeSettings(value: unknown, defaults: GameSettings): GameSettings {
  if (!isObject(value)) return { ...defaults };
  return {
    soundEffects: asBoolean(value.soundEffects, defaults.soundEffects),
    showTimer: asBoolean(value.showTimer, defaults.showTimer),
    autoCheckMistakes: asBoolean(value.autoCheckMistakes, defaults.autoCheckMistakes),
    limitMistakes: asBoolean(value.limitMistakes, defaults.limitMistakes ?? true),
    language: value.language === 'zh' || value.language === 'en' ? value.language : defaults.language,
  };
}

export function normalizeProfile(value: unknown, defaults: Profile): Profile {
  if (!isObject(value)) return { ...defaults };
  
  const completedDays: string[] = [];
  if (Array.isArray(value.completedDays)) {
    for (const d of value.completedDays) {
      if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
        completedDays.push(d);
      }
    }
  }

  let lastPlayedDate = defaults.lastPlayedDate;
  if (typeof value.lastPlayedDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.lastPlayedDate)) {
    lastPlayedDate = value.lastPlayedDate;
  } else if (value.lastPlayedDate === null) {
    lastPlayedDate = null;
  }

  return {
    username: asString(value.username, defaults.username),
    xp: Math.max(0, asFiniteNumber(value.xp, defaults.xp)),
    level: Math.max(1, asFiniteNumber(value.level, defaults.level)),
    streak: Math.max(0, asFiniteNumber(value.streak, defaults.streak)),
    lastPlayedDate,
    completedDays,
    avatar: asString(value.avatar, defaults.avatar),
  };
}

export function normalizeStats(value: unknown, defaults: Stats): Stats {
  if (!isObject(value)) {
    return { 
      ...defaults, 
      bestTimes: { ...defaults.bestTimes }, 
      weeklyActivity: { ...defaults.weeklyActivity }, 
      recentGames: [] 
    };
  }

  const gamesPlayed = Math.max(0, asFiniteNumber(value.gamesPlayed, defaults.gamesPlayed));
  const gamesWon = Math.max(0, asFiniteNumber(value.gamesWon, defaults.gamesWon));

  const bestTimes = { ...defaults.bestTimes };
  if (isObject(value.bestTimes)) {
    for (const diff of VALID_DIFFICULTIES) {
      const t = value.bestTimes[diff];
      if (typeof t === 'number' && Number.isFinite(t) && t >= 0) {
        bestTimes[diff] = t;
      }
    }
  }

  const weeklyActivity = { ...defaults.weeklyActivity };
  if (isObject(value.weeklyActivity)) {
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    for (const day of validDays) {
      const count = value.weeklyActivity[day];
      if (typeof count === 'number' && Number.isFinite(count) && count >= 0) {
        weeklyActivity[day] = count;
      }
    }
  }

  const recentGames: RecentGame[] = [];
  if (Array.isArray(value.recentGames)) {
    for (const g of value.recentGames) {
      if (isObject(g) && 
          typeof g.id === 'string' &&
          typeof g.date === 'string' &&
          typeof g.won === 'boolean' &&
          typeof g.difficulty === 'string' && VALID_DIFFICULTIES.includes(g.difficulty as Difficulty) &&
          typeof g.time === 'number' && Number.isFinite(g.time) && g.time >= 0 &&
          typeof g.xpEarned === 'number' && Number.isFinite(g.xpEarned) && g.xpEarned >= 0 &&
          typeof g.mistakes === 'number' && Number.isFinite(g.mistakes) && g.mistakes >= 0) {
        recentGames.push({
          id: g.id,
          difficulty: g.difficulty as Difficulty,
          time: g.time,
          date: g.date,
          won: g.won,
          xpEarned: g.xpEarned,
          mistakes: g.mistakes,
        });
      }
    }
  }

  return {
    gamesPlayed,
    gamesWon,
    bestTimes,
    weeklyActivity,
    recentGames,
  };
}

function isValidCell(val: unknown): val is Cell {
  if (!isObject(val)) return false;
  if (typeof val.row !== 'number' || !Number.isFinite(val.row)) return false;
  if (typeof val.col !== 'number' || !Number.isFinite(val.col)) return false;
  if (val.value !== null && (typeof val.value !== 'number' || !Number.isFinite(val.value))) return false;
  if (typeof val.solvedValue !== 'number' || !Number.isFinite(val.solvedValue)) return false;
  if (typeof val.isClue !== 'boolean') return false;
  if (typeof val.isInvalid !== 'boolean') return false;
  if (!Array.isArray(val.notes)) return false;
  for (const n of val.notes) {
    if (typeof n !== 'number' || !Number.isFinite(n)) return false;
  }
  return true;
}

export function normalizeAutosave(value: unknown): Autosave | null {
  if (!isObject(value)) return null;

  if (typeof value.difficulty !== 'string' || !VALID_DIFFICULTIES.includes(value.difficulty as Difficulty)) return null;
  if (typeof value.time !== 'number' || !Number.isFinite(value.time) || value.time < 0) return null;
  if (typeof value.mistakes !== 'number' || !Number.isFinite(value.mistakes) || value.mistakes < 0) return null;

  if (!Array.isArray(value.board)) return null;
  if (value.board.length !== 9) return null;

  const validBoard: Cell[][] = [];
  for (let r = 0; r < 9; r++) {
    const row = value.board[r];
    if (!Array.isArray(row) || row.length !== 9) return null;
    
    const validRow: Cell[] = [];
    for (let c = 0; c < 9; c++) {
      const cell = row[c];
      if (!isValidCell(cell)) return null;
      validRow.push({
        row: cell.row,
        col: cell.col,
        value: cell.value,
        solvedValue: cell.solvedValue,
        isClue: cell.isClue,
        notes: [...cell.notes],
        isInvalid: cell.isInvalid,
      });
    }
    validBoard.push(validRow);
  }

  return {
    difficulty: value.difficulty as Difficulty,
    time: value.time,
    mistakes: value.mistakes,
    board: validBoard,
  };
}
