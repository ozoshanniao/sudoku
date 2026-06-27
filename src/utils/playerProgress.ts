import { Profile, Stats, Difficulty, RecentGame } from '../types';

export interface GameCompletionContext {
  timeSec: number;
  mistakesCount: number;
  gameDifficulty: Difficulty;
  activeDailyDate: string | null;
  todayStr: string;
  yesterdayStr: string;
  matchDayStr: string;
  nowIsoString: string;
  randomId: string;
}

/**
 * Calculates XP reward based on difficulty and daily challenge status.
 */
export function calculateXpReward(difficulty: Difficulty, isDaily: boolean): number {
  let xpAllocated = 100;
  if (difficulty === 'medium') xpAllocated = 200;
  else if (difficulty === 'hard') xpAllocated = 300;
  else if (difficulty === 'expert') xpAllocated = 400;

  if (isDaily) xpAllocated += 100;
  
  return xpAllocated;
}

/**
 * Generates an updated Profile object after a game is completed.
 * It strictly adheres to the existing logic.
 */
export function updateProfileAfterCompletion(profile: Profile, context: GameCompletionContext): Profile {
  const currentProfile = {
    ...profile,
    completedDays: Array.isArray(profile.completedDays) ? profile.completedDays : [],
  };

  const xpEarned = calculateXpReward(context.gameDifficulty, !!context.activeDailyDate);
  const newXp = currentProfile.xp + xpEarned;
  
  let newLevel = currentProfile.level;
  const levelThreshold = currentProfile.level * 1000;
  
  let finalXp = newXp;
  if (newXp >= levelThreshold) {
    newLevel += 1;
    finalXp = newXp - levelThreshold;
  }

  let newStreak = currentProfile.streak;
  const lastStr = currentProfile.lastPlayedDate;
  
  if (lastStr !== context.todayStr) {
    if (lastStr === context.yesterdayStr) {
      newStreak += 1;
    } else if (lastStr !== context.todayStr) {
      newStreak = 1;
    }
  }

  let updatedCompletedDays = [...currentProfile.completedDays];
  if (context.activeDailyDate && !updatedCompletedDays.includes(context.activeDailyDate)) {
    updatedCompletedDays.push(context.activeDailyDate);
  }

  return {
    ...currentProfile,
    xp: finalXp,
    level: newLevel,
    streak: newStreak,
    lastPlayedDate: context.todayStr,
    completedDays: updatedCompletedDays,
  };
}

/**
 * Generates an updated Stats object after a game is completed.
 * It strictly adheres to the existing logic.
 */
export function updateStatsAfterCompletion(stats: Stats, context: GameCompletionContext): Stats {
  const currentStats = {
    ...stats,
    bestTimes: { ...stats.bestTimes },
    weeklyActivity: { ...stats.weeklyActivity },
    recentGames: Array.isArray(stats.recentGames) ? stats.recentGames : [],
  };

  const updatedGamesPlayed = currentStats.gamesPlayed + 1;
  const updatedGamesWon = currentStats.gamesWon + 1;

  const currentBest = currentStats.bestTimes[context.gameDifficulty];
  const newBest = currentBest === null ? context.timeSec : Math.min(currentBest, context.timeSec);

  const currentDayCount = currentStats.weeklyActivity[context.matchDayStr] || 0;

  const xpEarned = calculateXpReward(context.gameDifficulty, !!context.activeDailyDate);

  const newRecentGame: RecentGame = {
    id: context.randomId,
    difficulty: context.gameDifficulty,
    time: context.timeSec,
    date: context.nowIsoString,
    won: true,
    xpEarned,
    mistakes: context.mistakesCount,
  };

  const updatedRecent = [
    newRecentGame,
    ...currentStats.recentGames,
  ];

  return {
    ...currentStats,
    gamesPlayed: updatedGamesPlayed,
    gamesWon: updatedGamesWon,
    bestTimes: {
      ...currentStats.bestTimes,
      [context.gameDifficulty]: newBest,
    },
    weeklyActivity: {
      ...currentStats.weeklyActivity,
      [context.matchDayStr]: currentDayCount + 1,
    },
    recentGames: updatedRecent.slice(0, 20),
  };
}
