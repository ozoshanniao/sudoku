import React, { useState, useTransition } from 'react';
import { User, Award, Shield, Edit2, Check, Sparkles, Flame, Star } from 'lucide-react';
import { Profile, Stats } from '../types';
import { playSound } from '../utils/audio';
import { motion } from 'motion/react';

interface ProfileScreenProps {
  profile: Profile;
  stats: Stats;
  onUpdateName: (name: string) => void;
  onUpdateAvatar: (avatar: string) => void;
  soundEffects: boolean;
}

export default function ProfileScreen({
  profile,
  stats,
  onUpdateName,
  onUpdateAvatar,
  soundEffects,
}: ProfileScreenProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.username || 'Solver');
  const [, startTransition] = useTransition();

  const avatars = ['🧩', '🧠', '⚡', '🦉', '🔮', '🛡️', '🎯', '🪐'];

  const safeProfile = {
    username: profile?.username || 'Solver',
    level: typeof profile?.level === 'number' ? profile.level : 1,
    xp: typeof profile?.xp === 'number' ? profile.xp : 0,
    avatar: profile?.avatar || '🧩',
    streak: typeof profile?.streak === 'number' ? profile.streak : 0,
  };

  const safeGamesWon = stats?.gamesWon ?? 0;
  const safeRecentGames = Array.isArray(stats?.recentGames) ? stats.recentGames : [];
  const safeStreak = safeProfile.streak;

  const achievements = [
    {
      id: "first_win",
      title: "First Code Solved",
      desc: "Successfully solved your first Sudoku puzzle",
      unlocked: safeGamesWon >= 1,
      icon: <Check className="w-5 h-5 text-green-600" />,
    },
    {
      id: "expert_beaten",
      title: "Sudoku Arch-mage",
      desc: "Successfully beat an Expert puzzle",
      unlocked: safeRecentGames.some((g) => g && g.difficulty === 'expert' && g.won),
      icon: <Flame className="w-5 h-5 text-red-500" />,
    },
    {
      id: "no_mistakes",
      title: "Pristine Solver",
      desc: "Complete a puzzle without logging failures",
      unlocked: safeRecentGames.some((g) => g && g.won && g.mistakes === 0),
      icon: <Sparkles className="w-5 h-5 text-secondary" />,
    },
    {
      id: "streak_3",
      title: "Mindful Streaker",
      desc: "Maintained a 3+ day completion streak",
      unlocked: safeStreak >= 3,
      icon: <Star className="w-5 h-5 text-yellow-500 fill-current" />,
    },
  ];

  const handleUpdateNameSubmit = () => {
    if (nameInput.trim()) {
      if (soundEffects) playSound('click');
      startTransition(() => {
        onUpdateName(nameInput.trim());
        setIsEditingName(false);
      });
    }
  };

  const handleAvatarSelect = (emoji: string) => {
    if (soundEffects) playSound('click');
    startTransition(() => {
      onUpdateAvatar(emoji);
    });
  };

  const nextLevelXp = safeProfile.level * 1000;
  const xpPercent = Math.min((safeProfile.xp / nextLevelXp) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex-grow w-full max-w-sm mx-auto px-3 py-2 overflow-y-auto pb-4"
    >
      {/* Account Info Profile Header Card */}
      <div className="bg-white rounded-xl p-3 border border-[#eeeeee] shadow-sm flex flex-col items-center text-center relative mb-2.5">
        {/* Avatar Selection */}
        <div className="w-14 h-14 bg-secondary/11 rounded-full flex items-center justify-center text-2xl mb-2 border border-secondary/35 select-none hover:scale-105 transition-transform duration-200">
          {safeProfile.avatar}
        </div>

        {/* Edit Username form */}
        {isEditingName ? (
          <div className="flex gap-1.5 items-center w-full justify-center max-w-[160px]">
            <input
              type="text"
              value={nameInput}
              maxLength={15}
              onChange={(e) => setNameInput(e.target.value)}
              className="border border-[#c4c7c7] px-2 py-1 rounded-lg text-xs font-bold max-w-[100px] outline-none text-center bg-[#f5f5f5]"
              placeholder="Username"
            />
            <button
              onClick={handleUpdateNameSubmit}
              className="bg-green-600 text-white p-1.5 rounded-lg hover:opacity-90 transition-opacity cursor-pointer flex items-center"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 justify-center cursor-pointer group" onClick={() => setIsEditingName(true)}>
            <h3 className="text-xs font-black uppercase text-primary tracking-wider">{safeProfile.username}</h3>
            <Edit2 className="w-2.5 h-2.5 text-[#868381] group-hover:text-primary transition-colors" />
          </div>
        )}

        <div className="flex items-center gap-0.5 bg-[#eeeeee] px-2 py-0.5 rounded-md text-[7.5px] text-on-surface-variant font-black mt-1.5 select-none uppercase tracking-wider">
          <Shield className="w-2.5 h-2.5 text-secondary" />
          <span>LEVEL {safeProfile.level} SOLVER</span>
        </div>

        {/* Level Progress Slider */}
        <div className="w-full mt-3 text-left">
          <div className="flex justify-between text-[7.5px] text-on-surface-variant mb-0.5 font-bold select-none">
            <span>Next Level Progress</span>
            <span>{safeProfile.xp} / {nextLevelXp} XP</span>
          </div>
          <div className="w-full h-1 bg-[#eeeeee] rounded-full overflow-hidden relative">
            <div
              className="absolute left-0 top-0 h-full bg-secondary rounded-full transition-all duration-500"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Avatar Change Row */}
      <div className="bg-white p-2.5 rounded-xl border border-[#eeeeee] shadow-sm mb-2.5">
        <h4 className="text-[9.5px] font-black text-on-surface-variant uppercase tracking-wider mb-2.5 select-none">Customize Avatar</h4>
        <div className="flex gap-1.5 flex-wrap justify-center">
          {avatars.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleAvatarSelect(emoji)}
              className={`text-lg w-7.5 h-7.5 rounded-full flex items-center justify-center border transition-all hover:scale-110 cursor-pointer ${
                safeProfile.avatar === emoji
                  ? 'border-secondary bg-secondary/11'
                  : 'border-[#eeeeee] bg-[#f5f5f5] hover:bg-[#e2e2e2]'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Achievements List */}
      <div className="bg-white p-2.5 rounded-xl border border-[#eeeeee] shadow-sm">
        <h4 className="text-[10px] font-black text-primary flex items-center gap-1 mb-2.5 select-none uppercase tracking-wider">
          <Award className="w-3.5 h-3.5 text-secondary" />
          Badge Wall
        </h4>

        <div className="grid grid-cols-2 gap-2.5">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={`group flex flex-col items-center text-center gap-2 p-3 rounded-2xl border transition-all duration-300 select-none ${
                a.unlocked 
                  ? 'bg-white/80 backdrop-blur-md border-secondary/20 shadow-[0_2px_8px_rgba(54,84,200,0.06)] hover:shadow-md hover:-translate-y-0.5' 
                  : 'bg-gray-50/80 backdrop-blur-sm border-transparent opacity-60 grayscale'
              }`}
            >
              <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-transform duration-500 ${
                a.unlocked ? 'bg-secondary/11 text-secondary shadow-inner group-hover:scale-110 group-hover:bg-secondary/20' : 'bg-gray-200 text-gray-400'
              }`}>
                {a.unlocked ? a.icon : <Shield className="w-5 h-5" />}
              </div>
              <div className="flex flex-col items-center">
                <span className={`text-[10px] font-black block mb-1 tracking-wide ${a.unlocked ? 'text-primary' : 'text-gray-400'}`}>
                  {a.title}
                </span>
                <p className="text-[8px] text-[#555a5b] leading-tight">
                  {a.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </motion.div>
  );
}
