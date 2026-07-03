import { describe, it, expect } from 'vitest';
import { calculateXpReward, updateProfileAfterCompletion, updateStatsAfterCompletion, GameCompletionContext } from './playerProgress';
import { Profile, Stats, Difficulty } from '../types';

describe('Player Progress Domain Logic', () => {
  const createMockContext = (overrides?: Partial<GameCompletionContext>): GameCompletionContext => ({
    timeSec: 300,
    mistakesCount: 1,
    gameDifficulty: 'medium',
    activeDailyDate: null,
    todayStr: '2026-06-22',
    yesterdayStr: '2026-06-21',
    matchDayStr: 'Monday',
    nowIsoString: '2026-06-22T10:00:00Z',
    randomId: 'test-id-123',
    ...overrides,
  });

  const createMockProfile = (overrides?: Partial<Profile>): Profile => ({
    username: 'Test User',
    xp: 0,
    level: 1,
    streak: 0,
    lastPlayedDate: '2026-06-20',
    completedDays: [],
    avatar: '🧩',
    ...overrides,
  });

  const createMockStats = (overrides?: Partial<Stats>): Stats => ({
    gamesPlayed: 10,
    gamesWon: 8,
    bestTimes: { easy: 100, medium: 200, hard: null, expert: null },
    weeklyActivity: { Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 },
    recentGames: [],
    ...overrides,
  });

  describe('XP and Level Calculation', () => {
    it('should calculate correct XP reward for all difficulties (normal)', () => {
      expect(calculateXpReward('easy', false)).toBe(100);
      expect(calculateXpReward('medium', false)).toBe(200);
      expect(calculateXpReward('hard', false)).toBe(300);
      expect(calculateXpReward('expert', false)).toBe(400);
    });

    it('should add daily challenge bonus XP', () => {
      expect(calculateXpReward('easy', true)).toBe(200);
      expect(calculateXpReward('medium', true)).toBe(300);
    });

    it('should keep level same if XP does not cross threshold', () => {
      const profile = createMockProfile({ xp: 500, level: 1 });
      const context = createMockContext({ gameDifficulty: 'medium' }); // +200 XP -> 700

      const newProfile = updateProfileAfterCompletion(profile, context);

      expect(newProfile.xp).toBe(700);
      expect(newProfile.level).toBe(1);
      // original profile untouched
      expect(profile.xp).toBe(500);
    });

    it('should level up when crossing exactly the threshold', () => {
      const profile = createMockProfile({ xp: 900, level: 1 }); // Next level at 1000
      const context = createMockContext({ gameDifficulty: 'easy' }); // +100 XP -> 1000

      const newProfile = updateProfileAfterCompletion(profile, context);

      expect(newProfile.level).toBe(2);
      expect(newProfile.xp).toBe(0);
    });

    it('should roll over remainder XP after leveling up', () => {
      const profile = createMockProfile({ xp: 900, level: 1 }); // Next level at 1000
      const context = createMockContext({ gameDifficulty: 'hard' }); // +300 XP -> 1200

      const newProfile = updateProfileAfterCompletion(profile, context);

      expect(newProfile.level).toBe(2);
      expect(newProfile.xp).toBe(200);
    });

    it('should handle level threshold based on current level', () => {
      // Level 3 means threshold is 3000
      const profile = createMockProfile({ xp: 2800, level: 3 });
      const context = createMockContext({ gameDifficulty: 'expert' }); // +400 XP -> 3200

      const newProfile = updateProfileAfterCompletion(profile, context);

      expect(newProfile.level).toBe(4);
      expect(newProfile.xp).toBe(200);
    });
  });

  describe('Streak and Date Logic', () => {
    it('should increment streak if last played was exactly yesterday', () => {
      const profile = createMockProfile({ streak: 5, lastPlayedDate: '2026-06-21' });
      const context = createMockContext({ todayStr: '2026-06-22', yesterdayStr: '2026-06-21' });

      const newProfile = updateProfileAfterCompletion(profile, context);

      expect(newProfile.streak).toBe(6);
      expect(newProfile.lastPlayedDate).toBe('2026-06-22');
    });

    it('should reset streak to 1 if last played was before yesterday', () => {
      const profile = createMockProfile({ streak: 5, lastPlayedDate: '2026-06-19' });
      const context = createMockContext({ todayStr: '2026-06-22', yesterdayStr: '2026-06-21' });

      const newProfile = updateProfileAfterCompletion(profile, context);

      expect(newProfile.streak).toBe(1);
    });

    it('should preserve streak if already played today', () => {
      const profile = createMockProfile({ streak: 5, lastPlayedDate: '2026-06-22' });
      const context = createMockContext({ todayStr: '2026-06-22', yesterdayStr: '2026-06-21' });

      const newProfile = updateProfileAfterCompletion(profile, context);

      expect(newProfile.streak).toBe(5);
    });

    it('should track completed daily challenges', () => {
      const profile = createMockProfile({ completedDays: ['2026-06-21'] });
      const context = createMockContext({ activeDailyDate: '2026-06-22' });

      const newProfile = updateProfileAfterCompletion(profile, context);

      expect(newProfile.completedDays).toEqual(['2026-06-21', '2026-06-22']);
    });

    it('should not duplicate completed daily challenge dates', () => {
      const profile = createMockProfile({ completedDays: ['2026-06-22'] });
      const context = createMockContext({ activeDailyDate: '2026-06-22' });

      const newProfile = updateProfileAfterCompletion(profile, context);

      expect(newProfile.completedDays).toEqual(['2026-06-22']);
    });
  });

  describe('Daily Challenge Duplicate Prevention', () => {
    it('A. should grant bonus XP and record date for first-time completion', () => {
      const profile = createMockProfile({ xp: 0, completedDays: [] });
      const context = createMockContext({ activeDailyDate: '2026-06-22', gameDifficulty: 'easy' });

      const newProfile = updateProfileAfterCompletion(profile, context);

      expect(newProfile.xp).toBe(200); // 100 base + 100 bonus
      expect(newProfile.completedDays).toEqual(['2026-06-22']);
      expect(profile.completedDays).toEqual([]); // not mutated
    });

    it('B. should only grant base XP and not duplicate date for same-day repeat completion', () => {
      const profile = createMockProfile({ xp: 200, completedDays: ['2026-06-22'] });
      const context = createMockContext({ activeDailyDate: '2026-06-22', gameDifficulty: 'easy' });

      const newProfile = updateProfileAfterCompletion(profile, context);

      expect(newProfile.xp).toBe(300); // 200 previous + 100 base (NO 100 bonus)
      expect(newProfile.completedDays).toEqual(['2026-06-22']);
      expect(profile.completedDays).toEqual(['2026-06-22']); // not mutated
    });

    it('C. should grant bonus XP and append date when completing a different daily', () => {
      const profile = createMockProfile({ xp: 200, completedDays: ['2026-06-21'] });
      const context = createMockContext({ activeDailyDate: '2026-06-22', gameDifficulty: 'medium' });

      const newProfile = updateProfileAfterCompletion(profile, context);

      expect(newProfile.xp).toBe(500); // 200 previous + 200 base + 100 bonus
      expect(newProfile.completedDays).toEqual(['2026-06-21', '2026-06-22']);
    });

    it('D. should not grant bonus XP nor record date for normal game', () => {
      const profile = createMockProfile({ xp: 200, completedDays: ['2026-06-21'] });
      const context = createMockContext({ activeDailyDate: null, gameDifficulty: 'hard' });

      const newProfile = updateProfileAfterCompletion(profile, context);

      expect(newProfile.xp).toBe(500); // 200 previous + 300 base (NO bonus)
      expect(newProfile.completedDays).toEqual(['2026-06-21']);
    });
  });

  describe('Stats Update', () => {
    it('should increment games played and won', () => {
      const stats = createMockStats({ gamesPlayed: 10, gamesWon: 5 });
      const context = createMockContext();

      const newStats = updateStatsAfterCompletion(stats, context);

      expect(newStats.gamesPlayed).toBe(11);
      expect(newStats.gamesWon).toBe(6);
    });

    it('should update best time if it is the first time for difficulty', () => {
      const stats = createMockStats({ bestTimes: { easy: 100, medium: 200, hard: null, expert: null } });
      const context = createMockContext({ gameDifficulty: 'hard', timeSec: 150 });

      const newStats = updateStatsAfterCompletion(stats, context);

      expect(newStats.bestTimes.hard).toBe(150);
      expect(newStats.bestTimes.medium).toBe(200); // unchanged
    });

    it('should update best time if new time is faster', () => {
      const stats = createMockStats({ bestTimes: { easy: 100, medium: 200, hard: null, expert: null } });
      const context = createMockContext({ gameDifficulty: 'medium', timeSec: 150 });

      const newStats = updateStatsAfterCompletion(stats, context);

      expect(newStats.bestTimes.medium).toBe(150);
    });

    it('should not update best time if new time is slower', () => {
      const stats = createMockStats({ bestTimes: { easy: 100, medium: 200, hard: null, expert: null } });
      const context = createMockContext({ gameDifficulty: 'medium', timeSec: 250 });

      const newStats = updateStatsAfterCompletion(stats, context);

      expect(newStats.bestTimes.medium).toBe(200);
    });

    it('should increment weekly activity day', () => {
      const stats = createMockStats({ weeklyActivity: { Monday: 2, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 } });
      const context = createMockContext({ matchDayStr: 'Monday' });

      const newStats = updateStatsAfterCompletion(stats, context);

      expect(newStats.weeklyActivity['Monday']).toBe(3);
    });

    it('should prepend a new recent game log correctly', () => {
      const existingGame = { id: 'old', difficulty: 'easy' as Difficulty, time: 100, date: '2026-06-20', won: true, xpEarned: 100, mistakes: 0 };
      const stats = createMockStats({ recentGames: [existingGame] });
      const context = createMockContext({
        randomId: 'new-id',
        gameDifficulty: 'expert',
        timeSec: 400,
        nowIsoString: '2026-06-22T12:00:00Z',
        mistakesCount: 2,
      });

      const newStats = updateStatsAfterCompletion(stats, context);

      expect(newStats.recentGames).toHaveLength(2);
      expect(newStats.recentGames[0]).toEqual({
        id: 'new-id',
        difficulty: 'expert',
        time: 400,
        date: '2026-06-22T12:00:00Z',
        won: true,
        xpEarned: 400, // calculated from expert, non-daily
        mistakes: 2,
      });
      expect(newStats.recentGames[1]).toEqual(existingGame);
    });

    it('should prune recent games to a maximum of 20 entries', () => {
      const oldGames = Array.from({ length: 25 }, (_, i) => ({
        id: `old-${i}`,
        difficulty: 'easy' as Difficulty,
        time: 100,
        date: '2026-06-20',
        won: true,
        xpEarned: 100,
        mistakes: 0,
      }));
      const stats = createMockStats({ recentGames: oldGames });
      const context = createMockContext();

      const newStats = updateStatsAfterCompletion(stats, context);

      expect(newStats.recentGames).toHaveLength(20);
      expect(newStats.recentGames[0].id).toBe(context.randomId);
    });
  });
});
