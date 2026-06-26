import { Difficulty } from '../types';

export interface DailyConfig {
  date: string;
  difficulty: Difficulty;
  seed: number;
}

/**
 * Generates a consistent 32-bit integer hash from a string.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return hash;
}

/**
 * Returns the deterministic daily challenge configuration for a given date.
 * Date must be in YYYY-MM-DD format.
 */
export function getDailyChallengeConfig(dateStr: string): DailyConfig {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) {
    throw new Error(`Invalid date format: ${dateStr}. Expected YYYY-MM-DD`);
  }

  const parts = dateStr.split('-');
  const day = parseInt(parts[2], 10);
  
  let difficulty: Difficulty = 'medium';
  if (day % 4 === 0) difficulty = 'expert';
  else if (day % 4 === 1) difficulty = 'easy';
  else if (day % 4 === 2) difficulty = 'medium';
  else if (day % 4 === 3) difficulty = 'hard';

  const namespace = 'sudoku-daily-v1';
  const seedString = `${namespace}:${dateStr}:${difficulty}`;
  const seed = hashString(seedString);

  return {
    date: dateStr,
    difficulty,
    seed,
  };
}

/**
 * Creates a deterministic PRNG function (Mulberry32) from a 32-bit integer seed.
 */
export function createSeededRng(seed: number): () => number {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
