import React, { useMemo, useState } from 'react';
import { Award, TrendingUp, Clock, History, MoreHorizontal, ArrowRight, RefreshCw, BarChart3, Trash2 } from 'lucide-react';
import { Stats, Difficulty } from '../types';
import { playSound } from '../utils/audio';
import { motion } from 'motion/react';

interface StatsScreenProps {
  stats: Stats;
  soundEffects: boolean;
}

export default function StatsScreen({
  stats,
  soundEffects,
}: StatsScreenProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('hard');

  const displayedGamesPlayed = stats.gamesPlayed;
  const displayedWinRate = stats.gamesPlayed > 0 
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) 
    : 0;

  const bestTimeForSelected = stats.bestTimes[selectedDifficulty];

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Calculate real games played this week from stats.recentGames
  const gamesThisWeek = useMemo(() => {
    if (!stats.recentGames || stats.recentGames.length === 0) return 0;
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return stats.recentGames.filter(g => {
      try {
        const gameDate = new Date(g.date);
        return gameDate >= oneWeekAgo && g.won;
      } catch {
        return false;
      }
    }).length;
  }, [stats.recentGames]);

  // Calculate true average solve time for selected difficulty games
  const avgTimeForSelected = useMemo(() => {
    if (!stats.recentGames || stats.recentGames.length === 0) return null;
    const filteredGames = stats.recentGames.filter(g => g.difficulty === selectedDifficulty && g.won);
    if (filteredGames.length === 0) return null;
    const total = filteredGames.reduce((sum, g) => sum + g.time, 0);
    return Math.round(total / filteredGames.length);
  }, [stats.recentGames, selectedDifficulty]);

  // Map stats.weeklyActivity to M, T, W, T, F, S, S columns
  const weeklyDaysLabel = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const dayKeyMap = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const weeklyGames = useMemo(() => {
    const activity = stats.weeklyActivity || {};
    return dayKeyMap.map(day => activity[day] || 0);
  }, [stats.weeklyActivity]);

  // Find max value in weeklyGames to scale column heights dynamically
  const maxGames = useMemo(() => {
    const max = Math.max(...weeklyGames);
    return max > 0 ? max : 5; // default scale range is 5 if no games played
  }, [weeklyGames]);

  // Get current weekday name to highlight today's bar
  const todayStr = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  }, []);

  const formatDateSafe = (dateString?: string) => {
    if (!dateString) return 'Recent';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return 'Recent';
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex-grow w-full max-w-5xl mx-auto px-6 py-8 overflow-y-auto pb-16"
    >
      {/* Header */}
      <div className="mb-8 flex justify-between items-end pb-4 border-b border-[#eeeeee]">
        <div>
          <h2 className="font-display-cell text-display-cell text-primary font-bold mb-2 select-none">
            Performance Overview
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant select-none">
            All-time statistics across all difficulties.
          </p>
        </div>

      </div>

      {/* Bento Grid Layout for Stats */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 mb-12" id="stats-bento">
        {/* Metric Card 1: Games Played */}
        <div className="w-full bg-[#f3f3f3] rounded-2xl p-8 flex flex-col justify-between border border-transparent shadow-sm aspect-square lg:aspect-auto">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">
            Games Played
          </span>
          <div className="mt-8">
            <span className="font-display-cell text-display-cell text-primary font-medium block leading-none">
              {displayedGamesPlayed}
            </span>
            <div className="flex items-center gap-2 mt-4 text-secondary text-xs select-none">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="font-bold">+{gamesThisWeek} this week</span>
            </div>
          </div>
        </div>

        {/* Metric Card 2: Win Rate */}
        <div className="w-full bg-[#f3f3f3] rounded-2xl p-8 flex flex-col justify-between border border-transparent shadow-sm aspect-square lg:aspect-auto">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">
            Win Rate
          </span>
          <div className="mt-8">
            <span className="font-display-cell text-display-cell text-secondary font-medium block leading-none">
              {displayedWinRate}%
            </span>
            {/* Visual thin horizontal progress line */}
            <div className="w-full h-1 bg-surface-variant rounded-full mt-6 relative overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full bg-secondary transition-all duration-500 rounded-full"
                style={{ width: `${displayedWinRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Metric Card 3: Best Time Segmented Switcher */}
        <div className="w-full bg-[#f3f3f3] rounded-2xl p-6 flex flex-col justify-between border border-transparent shadow-sm aspect-square lg:aspect-auto">
          <div className="flex flex-col gap-3">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest block">
              Best Time
            </span>
            {/* Segmented Control */}
            <div className="flex bg-[#e8e8e8] p-[3px] rounded-lg w-full text-[10px] font-bold select-none relative z-10">
              {(['easy', 'medium', 'hard', 'expert'] as Difficulty[]).map((diff) => (
                <button
                  key={diff}
                  onClick={() => {
                    if (soundEffects) playSound('click');
                    setSelectedDifficulty(diff);
                  }}
                  className={`flex-1 py-1 rounded-md text-center capitalize cursor-pointer transition-all duration-200 ${
                    selectedDifficulty === diff
                      ? 'bg-white text-secondary shadow-xs font-black'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-6">
            <motion.div
              key={selectedDifficulty}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <span className="font-display-cell text-display-cell text-primary font-medium block leading-none">
                {bestTimeForSelected !== null ? formatTime(bestTimeForSelected) : '--:--'}
              </span>
              <div className="flex items-center gap-2 mt-4 text-on-surface-variant text-xs select-none">
                <Clock className="w-3.5 h-3.5" />
                <span>Avg: {avgTimeForSelected !== null ? formatTime(avgTimeForSelected) : '--:--'}</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Weekly Activity columns (Full Width Card) */}
      <div className="w-full bg-[#f3f3f3] rounded-2xl p-8 border border-transparent shadow-sm mb-12">
        <div className="flex justify-between items-center mb-8">
          <span className="font-headline-md text-headline-md font-bold text-primary">Weekly Activity</span>
          <span className="font-note-cell text-note-cell text-on-surface-variant bg-surface-variant rounded-full px-3 py-1.5">
            LAST 7 DAYS
          </span>
        </div>

        <div className="flex items-end justify-between h-28 pt-2">
          {weeklyDaysLabel.map((dayName, idx) => {
            const labelShort = dayName;
            const val = weeklyGames[idx];
            const heightPercent = `${(val / maxGames) * 100}%`;
            const isToday = dayKeyMap[idx] === todayStr;

            return (
              <div key={idx} className="flex flex-col items-center gap-3 h-full justify-end w-8">
                <div
                  className={`w-6 rounded-t-md transition-all duration-500 ${
                    isToday ? 'bg-secondary' : 'bg-[#e0e0e0] hover:bg-neutral-300'
                  }`}
                  style={{ height: heightPercent }}
                />
                <span className={`font-body-md text-body-md ${isToday ? 'text-secondary font-bold' : 'text-on-surface-variant'}`}>
                  {labelShort}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Games List (Minimalist Table) */}
      <div className="w-full mb-8 bg-[#f3f3f3] rounded-2xl p-8 shadow-sm">
        <h3 className="font-headline-md text-headline-md font-bold text-primary mb-6">
          Recent Games
        </h3>

        {(!stats || !Array.isArray(stats.recentGames) || stats.recentGames.length === 0) ? (
          <p className="text-xs text-[#444748] py-4 text-center select-none font-bold">
            No games completed yet. Play & solve a board!
          </p>
        ) : (
          <div className="divide-y divide-[#c4c7c7]" id="recent-games-list">
            {stats.recentGames.slice(0, 5).map((g) => (
              <div key={g.id} className="flex items-center justify-between py-4 hover:bg-surface-container transition-colors px-4 -mx-4 rounded-xl">
                <div className="flex items-center gap-4 w-1/3">
                  <span className="font-body-md text-body-md text-primary font-medium capitalize">{g.difficulty}</span>
                  {g.difficulty === 'expert' && (
                    <Award className="w-4 h-4 text-secondary" />
                  )}
                </div>
                <span className="font-body-md text-body-md text-on-surface-variant w-1/3 text-center">
                  {formatDateSafe(g.date)}
                </span>
                <span className="font-body-md text-body-md text-primary font-medium w-1/3 text-right">
                  {formatTime(g.time)}
                </span>
              </div>
            ))}
          </div>
        )}
        

      </div>
    </motion.div>
  );
}
