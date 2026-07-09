import React, { startTransition } from 'react';
import { Smile, BarChart2, AlertTriangle, Flame, Play } from 'lucide-react';
import { Difficulty, GameSettings } from '../types';
import { playSound } from '../utils/audio';
import { motion } from 'motion/react';

interface DifficultySettingsScreenProps {
  difficulty: Difficulty;
  onChangeDifficulty: (diff: Difficulty) => void;
  settings: GameSettings;
  onConfirmStartGame: () => void;
}

export default function DifficultySettingsScreen({
  difficulty,
  onChangeDifficulty,
  settings,
  onConfirmStartGame,
}: DifficultySettingsScreenProps) {
  const isChinese = settings.language === 'zh';
  const difficulties: { val: Difficulty; label: string; icon: React.ReactNode }[] = [
    {
      val: 'easy',
      label: isChinese ? '简单' : 'Easy',
      icon: <Smile className="w-5 h-5 group-hover:text-primary mb-1 transition-colors duration-200" />,
    },
    {
      val: 'medium',
      label: isChinese ? '中等' : 'Medium',
      icon: <BarChart2 className="w-5 h-5 text-secondary mb-1" />,
    },
    {
      val: 'hard',
      label: isChinese ? '困难' : 'Hard',
      icon: <AlertTriangle className="w-5 h-5 group-hover:text-primary mb-1 transition-colors duration-200" />,
    },
    {
      val: 'expert',
      label: isChinese ? '专家' : 'Expert',
      icon: <Flame className="w-5 h-5 group-hover:text-primary mb-1 transition-colors duration-200" />,
    },
  ];

  const handleDifficultyClick = (val: Difficulty) => {
    if (settings.soundEffects) playSound('click');
    onChangeDifficulty(val);
  };


  const handleConfirmGroup = () => {
    if (settings.soundEffects) playSound('click');
    startTransition(() => {
      onConfirmStartGame();
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex-grow px-6 py-8 max-w-2xl mx-auto w-full flex flex-col gap-8 pb-16"
    >
      {/* Title */}
      <section className="flex flex-col gap-4">
        <h2 className="font-headline-md text-headline-md text-primary select-none pb-2">{isChinese ? '选择难度' : 'Select Difficulty'}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {difficulties.map(({ val, label, icon }) => {
            const isActive = difficulty === val;
            return (
              <button
                key={val}
                onClick={() => handleDifficultyClick(val)}
                className={`group shadow-sm rounded-2xl p-4 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer border ${
                  isActive
                    ? 'border-transparent bg-secondary/10 text-secondary'
                    : 'border-[#eeeeee] bg-white text-on-surface hover:bg-surface-container-low hover:shadow-md'
                }`}
              >
                <span className={`mb-2 scale-125 transition-transform ${isActive ? 'text-secondary font-bold' : 'text-[#747878] group-hover:text-primary'}`}>
                  {icon}
                </span>
                <span className={`font-label-caps text-label-caps tracking-widest ${isActive ? 'text-secondary font-bold' : 'text-on-surface'}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Start Button */}
      <div className="mt-auto pt-8">
        <button
          onClick={handleConfirmGroup}
          id="confirm-start-button"
          className="w-full bg-secondary text-white font-headline-md text-headline-md py-4 rounded-2xl shadow-md flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
        >
          <span>{isChinese ? '开始游戏' : 'Start Game'}</span>
          <Play className="w-5 h-5 fill-current" />
        </button>
      </div>
    </motion.div>
  );
}
