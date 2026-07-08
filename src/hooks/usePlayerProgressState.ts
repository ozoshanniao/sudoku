import { useState, useEffect, useTransition } from 'react';
import { Profile, Stats } from '../types';
import { safeStorage } from '../utils/storage';
import { normalizeProfile, normalizeStats } from '../utils/persistedState';
import { updateProfileAfterCompletion, updateStatsAfterCompletion, GameCompletionContext } from '../utils/playerProgress';

export const DEFAULT_PROFILE: Profile = {
  username: 'Player',
  xp: 0,
  level: 1,
  streak: 0,
  lastPlayedDate: null,
  completedDays: [],
  avatar: '🧩',
};

export const DEFAULT_STATS: Stats = {
  gamesPlayed: 0,
  gamesWon: 0,
  bestTimes: {
    easy: null,
    medium: null,
    hard: null,
    expert: null,
  },
  weeklyActivity: {
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0,
    Sunday: 0,
  },
  recentGames: [],
};

export function usePlayerProgressState() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
  const [, startTransition] = useTransition();

  useEffect(() => {
    try {
      const storedProfile = safeStorage.getItem('sudoku_profile');
      if (storedProfile) {
        try {
          const parsed = JSON.parse(storedProfile);
          setProfile(normalizeProfile(parsed, DEFAULT_PROFILE));
        } catch (e) {
          console.warn('Invalid profile JSON', e);
        }
      }

      const storedStats = safeStorage.getItem('sudoku_stats');
      if (storedStats) {
        try {
          const parsed = JSON.parse(storedStats);
          setStats(normalizeStats(parsed, DEFAULT_STATS));
        } catch (e) {
          console.warn('Invalid stats JSON', e);
        }
      }
    } catch (err) {
      console.warn('Local Storage load fail (Player Progress):', err);
    }
  }, []);

  const updatePlayerName = (newName: string) => {
    const upProfile = { ...profile, username: newName };
    setProfile(upProfile);
    safeStorage.setItem('sudoku_profile', JSON.stringify(upProfile));
  };

  const updatePlayerAvatar = (newAvatar: string) => {
    const upProfile = { ...profile, avatar: newAvatar };
    setProfile(upProfile);
    safeStorage.setItem('sudoku_profile', JSON.stringify(upProfile));
  };

  const clearStats = () => {
    const freshStats: Stats = {
      gamesPlayed: 0,
      gamesWon: 0,
      bestTimes: { easy: null, medium: null, hard: null, expert: null },
      weeklyActivity: { Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 },
      recentGames: [],
    };
    setStats(freshStats);
    safeStorage.setItem('sudoku_stats', JSON.stringify(freshStats));

    startTransition(() => {
      const freshProfile: Profile = {
        ...profile,
        xp: 0,
        level: 1,
        streak: 0,
        completedDays: [],
      };
      setProfile(freshProfile);
      safeStorage.setItem('sudoku_profile', JSON.stringify(freshProfile));
    });
  };

  const applyGameCompletion = (context: GameCompletionContext) => {
    const updatedProfile = updateProfileAfterCompletion(profile, context);
    setProfile(updatedProfile);
    safeStorage.setItem('sudoku_profile', JSON.stringify(updatedProfile));

    const updatedStats = updateStatsAfterCompletion(stats, context);
    setStats(updatedStats);
    safeStorage.setItem('sudoku_stats', JSON.stringify(updatedStats));
  };

  return {
    profile,
    stats,
    updatePlayerName,
    updatePlayerAvatar,
    clearStats,
    applyGameCompletion,
  };
}
