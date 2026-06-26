import React, { startTransition } from 'react';
import { Smile, BarChart2, AlertTriangle, Flame, Volume2, Timer, CheckCircle, Play, AlertCircle } from 'lucide-react';
import { Difficulty, GameSettings } from '../types';
import { playSound } from '../utils/audio';
import { motion } from 'motion/react';

interface DifficultySettingsScreenProps {
  difficulty: Difficulty;
  onChangeDifficulty: (diff: Difficulty) => void;
  settings: GameSettings;
  onChangeSettings: (settings: GameSettings) => void;
  onConfirmStartGame: () => void;
}

export default function DifficultySettingsScreen({
  difficulty,
  onChangeDifficulty,
  settings,
  onChangeSettings,
  onConfirmStartGame,
}: DifficultySettingsScreenProps) {
  const difficulties: { val: Difficulty; label: string; icon: React.ReactNode }[] = [
    {
      val: 'easy',
      label: 'Easy',
      icon: <Smile className="w-5 h-5 group-hover:text-primary mb-1 transition-colors duration-200" />,
    },
    {
      val: 'medium',
      label: 'Medium',
      icon: <BarChart2 className="w-5 h-5 text-secondary mb-1" />,
    },
    {
      val: 'hard',
      label: 'Hard',
      icon: <AlertTriangle className="w-5 h-5 group-hover:text-primary mb-1 transition-colors duration-200" />,
    },
    {
      val: 'expert',
      label: 'Expert',
      icon: <Flame className="w-5 h-5 group-hover:text-primary mb-1 transition-colors duration-200" />,
    },
  ];

  const handleDifficultyClick = (val: Difficulty) => {
    if (settings.soundEffects) playSound('click');
    onChangeDifficulty(val);
  };

  const toggleSound = () => {
    const newSettings = { ...settings, soundEffects: !settings.soundEffects };
    if (newSettings.soundEffects) playSound('click');
    onChangeSettings(newSettings);
  };

  const toggleTimer = () => {
    if (settings.soundEffects) playSound('click');
    onChangeSettings({ ...settings, showTimer: !settings.showTimer });
  };

  const toggleAutoCheck = () => {
    if (settings.soundEffects) playSound('click');
    onChangeSettings({ ...settings, autoCheckMistakes: !settings.autoCheckMistakes });
  };

  const toggleLimitMistakes = () => {
    if (settings.soundEffects) playSound('click');
    onChangeSettings({ ...settings, limitMistakes: !settings.limitMistakes });
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
        <h2 className="font-headline-md text-headline-md text-primary select-none pb-2">Select Difficulty</h2>
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

      {/* Game Settings */}
      <section className="flex flex-col gap-4">
        <h2 className="font-headline-md text-headline-md text-primary select-none pb-2">Game Settings</h2>
        <div className="flex flex-col gap-2 bg-transparent">
          {/* Sound Toggle */}
          <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
            <div className="flex items-center gap-4">
              <Volume2 className="w-5 h-5 text-[#444748]" />
              <span className="font-body-md text-body-md text-on-surface select-none">Sound Effects</span>
            </div>
            
            <button
              onClick={toggleSound}
              className={`w-12 h-6 shrink-0 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-300 ${
                settings.soundEffects ? 'bg-secondary' : 'bg-[#c4c7c7]'
              }`}
              id="sound_toggle_action"
            >
              <div
                className={`bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-300 ${
                  settings.soundEffects ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Show Timer Toggle */}
          <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
            <div className="flex items-center gap-4">
              <Timer className="w-5 h-5 text-[#444748]" />
              <span className="font-body-md text-body-md text-on-surface select-none">Show Timer</span>
            </div>
            
            <button
              onClick={toggleTimer}
              className={`w-12 h-6 shrink-0 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-300 ${
                settings.showTimer ? 'bg-secondary' : 'bg-[#c4c7c7]'
              }`}
              id="timer_toggle_action"
            >
              <div
                className={`bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-300 ${
                  settings.showTimer ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Auto check Mistakes Toggle */}
          <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
            <div className="flex items-center gap-4">
              <CheckCircle className="w-5 h-5 text-[#444748]" />
              <span className="font-body-md text-body-md text-on-surface select-none">Auto-check Mistakes</span>
            </div>
            
            <button
              onClick={toggleAutoCheck}
              className={`w-12 h-6 shrink-0 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-300 ${
                settings.autoCheckMistakes ? 'bg-secondary' : 'bg-[#c4c7c7]'
              }`}
              id="autocheck_toggle_action"
            >
              <div
                className={`bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-300 ${
                  settings.autoCheckMistakes ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Limit Mistakes Toggle */}
          <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
            <div className="flex items-center gap-4">
              <AlertCircle className="w-5 h-5 text-[#444748]" />
              <span className="font-body-md text-body-md text-on-surface select-none">Limit Mistakes (3 Failures)</span>
            </div>
            
            <button
              onClick={toggleLimitMistakes}
              className={`w-12 h-6 shrink-0 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-300 ${
                settings.limitMistakes !== false ? 'bg-secondary' : 'bg-[#c4c7c7]'
              }`}
              id="limit_mistakes_toggle_action"
            >
              <div
                className={`bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-300 ${
                  settings.limitMistakes !== false ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Start Button */}
      <div className="mt-auto pt-8">
        <button
          onClick={handleConfirmGroup}
          id="confirm-start-button"
          className="w-full bg-secondary text-white font-headline-md text-headline-md py-4 rounded-2xl shadow-md flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
        >
          <span>Start Game</span>
          <Play className="w-5 h-5 fill-current" />
        </button>
      </div>
    </motion.div>
  );
}
