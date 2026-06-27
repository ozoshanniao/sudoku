import { describe, it, expect } from 'vitest';
import { normalizeSettings, normalizeProfile, normalizeStats, normalizeAutosave } from './persistedState';
import { GameSettings, Profile, Stats, Cell } from '../types';

describe('Persisted State Normalization', () => {
  describe('normalizeSettings', () => {
    const defaults: GameSettings = {
      soundEffects: true,
      showTimer: true,
      autoCheckMistakes: true,
      limitMistakes: true,
    };

    it('should return defaults for null or non-object', () => {
      expect(normalizeSettings(null, defaults)).toEqual(defaults);
      expect(normalizeSettings('invalid', defaults)).toEqual(defaults);
    });

    it('should keep valid settings', () => {
      const valid = { soundEffects: false, showTimer: false, autoCheckMistakes: false, limitMistakes: false };
      expect(normalizeSettings(valid, defaults)).toEqual(valid);
    });

    it('should fallback to defaults for invalid types', () => {
      const invalid = { soundEffects: 'yes', showTimer: null };
      const normalized = normalizeSettings(invalid, defaults);
      expect(normalized.soundEffects).toBe(true);
      expect(normalized.showTimer).toBe(true);
    });
  });

  describe('normalizeProfile', () => {
    const defaults: Profile = {
      username: 'Player',
      xp: 0,
      level: 1,
      streak: 0,
      lastPlayedDate: null,
      completedDays: [],
      avatar: '😊',
    };

    it('should cap negative numbers to 0 or 1', () => {
      const invalid = { xp: -50, level: -5, streak: -10 };
      const normalized = normalizeProfile(invalid, defaults);
      expect(normalized.xp).toBe(0);
      expect(normalized.level).toBe(1);
      expect(normalized.streak).toBe(0);
    });

    it('should ignore invalid dates', () => {
      const invalid = { lastPlayedDate: 'yesterday', completedDays: ['123', '2026-06-25'] };
      const normalized = normalizeProfile(invalid, defaults);
      expect(normalized.lastPlayedDate).toBeNull();
      expect(normalized.completedDays).toEqual(['2026-06-25']);
    });

    it('should preserve valid profile', () => {
      const valid: Profile = {
        username: 'Test',
        xp: 100,
        level: 2,
        streak: 5,
        lastPlayedDate: '2026-06-25',
        completedDays: ['2026-06-25'],
        avatar: '🐱',
      };
      expect(normalizeProfile(valid, defaults)).toEqual(valid);
    });
  });

  describe('normalizeStats', () => {
    const defaults: Stats = {
      gamesPlayed: 0,
      gamesWon: 0,
      bestTimes: { easy: null, medium: null, hard: null, expert: null },
      weeklyActivity: { Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 },
      recentGames: [],
    };

    it('should filter out invalid recent games', () => {
      const invalid = {
        recentGames: [
          { id: '1', difficulty: 'easy', time: 100, date: '2026-06-25', won: true, xpEarned: 100, mistakes: 0 }, // valid
          { id: '2', difficulty: 'unknown', time: 100, date: '2026-06-25', won: true, xpEarned: 100, mistakes: 0 }, // invalid diff
          { id: '3', difficulty: 'easy', time: -10, date: '2026-06-25', won: true, xpEarned: 100, mistakes: 0 }, // invalid time
          null, // totally invalid
        ],
      };
      const normalized = normalizeStats(invalid, defaults);
      expect(normalized.recentGames).toHaveLength(1);
      expect(normalized.recentGames[0].id).toBe('1');
    });

    it('should filter out invalid weekly activity', () => {
      const invalid = {
        weeklyActivity: {
          Monday: 5,
          Tuesday: -2, // invalid
          Funday: 10, // invalid key
        },
      };
      const normalized = normalizeStats(invalid, defaults);
      expect(normalized.weeklyActivity.Monday).toBe(5);
      expect(normalized.weeklyActivity.Tuesday).toBe(0);
      expect((normalized.weeklyActivity as any).Funday).toBeUndefined();
    });
  });

  describe('normalizeAutosave', () => {
    it('should return null for non-object', () => {
      expect(normalizeAutosave(null)).toBeNull();
      expect(normalizeAutosave('invalid')).toBeNull();
    });

    it('should return null for invalid board size', () => {
      expect(normalizeAutosave({ difficulty: 'easy', time: 0, mistakes: 0, board: [] })).toBeNull();
    });

    it('should return null if any cell is invalid', () => {
      const validCell: Cell = { row: 0, col: 0, value: null, solvedValue: 1, isClue: false, notes: [], isInvalid: false };
      const board = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => ({ ...validCell })));
      board[0][0].solvedValue = NaN; // Corrupt a cell
      
      expect(normalizeAutosave({ difficulty: 'easy', time: 0, mistakes: 0, board })).toBeNull();
    });

    it('should preserve valid autosave', () => {
      const validCell: Cell = { row: 0, col: 0, value: null, solvedValue: 1, isClue: false, notes: [1, 2], isInvalid: false };
      const board = Array.from({ length: 9 }, (_, r) => 
        Array.from({ length: 9 }, (_, c) => ({ ...validCell, row: r, col: c }))
      );
      const valid = { difficulty: 'easy', time: 100, mistakes: 1, board };
      
      const normalized = normalizeAutosave(valid);
      expect(normalized).not.toBeNull();
      expect(normalized?.difficulty).toBe('easy');
      expect(normalized?.time).toBe(100);
      expect(normalized?.mistakes).toBe(1);
    });
  });
});
