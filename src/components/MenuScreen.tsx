import React, { startTransition } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { playSound } from '../utils/audio';
import { motion } from 'motion/react';
import { GameSettings } from '../types';

interface MenuScreenProps {
  onStartNewGame: () => void;
  onResumeGame: () => void;
  hasSavedGame: boolean;
  streak: number;
  soundEffects: boolean;
  language: GameSettings['language'];
}

export default function MenuScreen({
  onStartNewGame,
  onResumeGame,
  hasSavedGame,
  streak,
  soundEffects,
  language,
}: MenuScreenProps) {
  const isChinese = language === 'zh';
  const safeStreak = Number.isFinite(streak) && streak > 0 ? Math.floor(streak) : 0;
  const dots = Array.from({ length: 7 }, (_, i) => i < (safeStreak % 8 === 0 && safeStreak > 0 ? 7 : safeStreak % 7));

  const handleStartGroup = () => {
    if (soundEffects) playSound('click');
    startTransition(() => {
      onStartNewGame();
    });
  };

  const handleResumeGroup = () => {
    if (soundEffects) playSound('click');
    startTransition(() => {
      onResumeGame();
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex-grow flex flex-col items-center justify-center px-6 relative z-10 space-y-16 pb-16 pt-4"
    >
      {/* Decorative Grid and Header */}
      <div className="text-center">
        <h1 className="font-display-cell-mobile text-display-cell-mobile font-bold tracking-tight text-primary mb-8 select-none">
          SUDOKU
        </h1>
        
        {/* Decorative 3x3 Mini Grid matching the design code exactly */}
        <div id="mini-grid" className="w-16 h-16 mx-auto grid grid-cols-3 grid-rows-3 gap-1">
          <div className="bg-surface-variant rounded-[2px]"></div>
          <div className="bg-primary rounded-[2px]"></div>
          <div className="bg-surface-variant rounded-[2px]"></div>
          <div className="bg-surface-variant rounded-[2px] text-primary flex items-center justify-center font-bold text-xs">5</div>
          <div className="bg-surface-variant rounded-[2px]"></div>
          <div className="bg-surface-variant rounded-[2px]"></div>
          <div className="bg-primary rounded-[2px]"></div>
          <div className="bg-surface-variant rounded-[2px]"></div>
          <div className="bg-surface-variant rounded-[2px] text-primary flex items-center justify-center font-bold text-xs">9</div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-5 w-full max-w-[280px]">
        <button
          onClick={handleStartGroup}
          id="start-new-button"
          className="bg-secondary text-white py-5 px-8 rounded-full w-full flex items-center justify-center gap-3 shadow-[0_8px_20px_rgba(54,84,200,0.25)] hover:shadow-[0_12px_24px_rgba(54,84,200,0.35)] active:scale-[0.98] transition-all duration-300 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          <span className="font-label-caps text-label-caps tracking-widest">{isChinese ? '开始游戏' : 'START GAME'}</span>
        </button>

        {hasSavedGame && (
          <button
            onClick={handleResumeGroup}
            id="resume-puzzle-button"
            className="bg-surface-container hover:bg-surface-container-high text-primary py-5 px-8 rounded-full w-full flex items-center justify-center gap-3 active:scale-[0.98] transition-all duration-300 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="font-label-caps text-label-caps tracking-widest">{isChinese ? '继续棋局' : 'RESUME PUZZLE'}</span>
          </button>
        )}
      </div>

      {/* Quick stats/info */}
      <div className="text-center flex flex-col items-center">
        <span className="font-note-cell text-note-cell text-on-surface-variant uppercase tracking-[0.15em] select-none">
          {isChinese ? `当前连胜：${safeStreak} 天` : `Current Streak: ${safeStreak} ${safeStreak === 1 ? 'Day' : 'Days'}`}
        </span>
        <div className="flex gap-2 mt-4" id="streak-dots">
          {dots.map((filled, idx) => (
            <div
              key={idx}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                filled ? 'bg-secondary' : 'bg-surface-variant'
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
