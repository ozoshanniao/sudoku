import React, { useState, useEffect, useTransition } from 'react';
import { Grid3X3, Calendar, BarChart3, User, Menu, Settings } from 'lucide-react';
import { Difficulty, Screen, GameSettings, Profile, Stats, Cell } from './types';
import MenuScreen from './components/MenuScreen';
import DifficultySettingsScreen from './components/DifficultySettingsScreen';
import GameplayScreen from './components/GameplayScreen';
import DailyChallengeScreen from './components/DailyChallengeScreen';
import StatsScreen from './components/StatsScreen';
import ProfileScreen from './components/ProfileScreen';
import { generateSudokuAsync } from './utils/sudoku';
import { getDailyChallengeConfig } from './utils/dailyChallenge';
import { playSound } from './utils/audio';
import { safeStorage } from './utils/storage';
import { updateProfileAfterCompletion, updateStatsAfterCompletion, GameCompletionContext } from './utils/playerProgress';
import { formatLocalDateKey, getPreviousLocalDateKey } from './utils/localDate';
import { normalizeSettings, normalizeProfile, normalizeStats, normalizeAutosave } from './utils/persistedState';

// Initial state structures
const DEFAULT_SETTINGS: GameSettings = {
  soundEffects: true,
  showTimer: true,
  autoCheckMistakes: true,
  limitMistakes: true,
};

const DEFAULT_PROFILE: Profile = {
  username: 'Sage Solver',
  xp: 450,
  level: 2,
  streak: 4,
  lastPlayedDate: '2026-06-21',
  completedDays: ['2026-06-18', '2026-06-19', '2026-06-20', '2026-06-21'],
  avatar: '🧩',
};

const DEFAULT_STATS: Stats = {
  gamesPlayed: 142,
  gamesWon: 96,
  bestTimes: {
    easy: 194,
    medium: 345,
    hard: 512,
    expert: null,
  },
  weeklyActivity: {
    Monday: 2,
    Tuesday: 4,
    Wednesday: 1,
    Thursday: 5,
    Friday: 3,
    Saturday: 6,
    Sunday: 4,
  },
  recentGames: [
    { id: '1', difficulty: 'hard', time: 512, date: '2026-06-21T18:30:00Z', won: true, xpEarned: 300, mistakes: 2 },
    { id: '2', difficulty: 'medium', time: 345, date: '2026-06-20T14:15:00Z', won: true, xpEarned: 200, mistakes: 1 },
    { id: '3', difficulty: 'easy', time: 194, date: '2026-06-19T09:44:00Z', won: true, xpEarned: 100, mistakes: 0 },
  ],
};

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);

  // Active game states
  const [gameDifficulty, setGameDifficulty] = useState<Difficulty>('medium');
  const [activeBoard, setActiveBoard] = useState<Cell[][] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasSavedGame, setHasSavedGame] = useState(false);
  const [savedMistakesCount, setSavedMistakesCount] = useState(0);
  const [savedSecondsElapsed, setSavedSecondsElapsed] = useState(0);
  const [activeDailyDate, setActiveDailyDate] = useState<string | null>(null);

  const [, startTransition] = useTransition();

  // Load custom saved parameters from safeStorage upon mounting
  useEffect(() => {
    try {
      const storedSettings = safeStorage.getItem('sudoku_settings');
      if (storedSettings) {
        try {
          const parsed = JSON.parse(storedSettings);
          setSettings(normalizeSettings(parsed, DEFAULT_SETTINGS));
        } catch (e) {
          console.warn('Invalid settings JSON', e);
        }
      }

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

      const autosaveStr = safeStorage.getItem('sudoku_autosave');
      if (autosaveStr) {
        try {
          const parsedObj = JSON.parse(autosaveStr);
          const normalizedAutosave = normalizeAutosave(parsedObj);
          if (normalizedAutosave) {
            setHasSavedGame(true);
          } else {
            setHasSavedGame(false);
            safeStorage.removeItem('sudoku_autosave');
          }
        } catch (e) {
          console.warn('Invalid autosave JSON', e);
          setHasSavedGame(false);
          safeStorage.removeItem('sudoku_autosave');
        }
      }
    } catch (err) {
      console.warn('Local Storage load fail:', err);
    }
  }, []);

  // Sync settings when modified
  const handleUpdateSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    safeStorage.setItem('sudoku_settings', JSON.stringify(newSettings));
  };

  // Nav tab clicked handler
  const handleTabClick = (target: Screen) => {
    if (settings.soundEffects) playSound('click');
    setScreen(target);
  };

  // Triggers difficulty options page
  const handleTriggerStartNew = () => {
    setActiveDailyDate(null);
    setScreen('difficulty-settings');
  };

  // Prepares the board matching the difficulty configuration
  const handleConfirmStart = async () => {
    setIsGenerating(true);
    try {
      const newBoard = await generateSudokuAsync(gameDifficulty);
      setActiveBoard(newBoard);
      setSavedMistakesCount(0);
      setSavedSecondsElapsed(0);
      setScreen('game');
    } catch (error) {
      console.error('Failed to generate sudoku:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Resumes previous board state saved automatically
  const handleResumePuzzle = () => {
    try {
      const autosaveStr = safeStorage.getItem('sudoku_autosave');
      if (autosaveStr) {
        const parsedObj = JSON.parse(autosaveStr);
        const normalized = normalizeAutosave(parsedObj);
        if (normalized) {
          setGameDifficulty(normalized.difficulty);
          setActiveBoard(normalized.board);
          setSavedMistakesCount(normalized.mistakes);
          setSavedSecondsElapsed(normalized.time);
          setScreen('game');
        } else {
          setHasSavedGame(false);
          safeStorage.removeItem('sudoku_autosave');
        }
      }
    } catch (e) {
      console.error(e);
      setHasSavedGame(false);
      safeStorage.removeItem('sudoku_autosave');
    }
  };

  // Connects daily challenge dates as custom deterministic games
  const handlePlayDailyChallenge = async (dateStr: string) => {
    setActiveDailyDate(dateStr);
    
    let config;
    try {
      config = getDailyChallengeConfig(dateStr);
    } catch (e) {
      console.error(e);
      return;
    }

    setGameDifficulty(config.difficulty);
    setIsGenerating(true);
    try {
      // Generate board based on daily deterministic seed layout
      const newBoard = await generateSudokuAsync(config.difficulty, config.seed);
      setActiveBoard(newBoard);
      setSavedMistakesCount(0);
      setSavedSecondsElapsed(0);
      setScreen('game');
    } catch (error) {
      console.error('Failed to generate daily challenge sudoku:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGameQuit = () => {
    setActiveBoard(null);
    setActiveDailyDate(null);
    // Refresh autosave display option
    try {
      const autosaveStr = safeStorage.getItem('sudoku_autosave');
      if (autosaveStr) {
        const parsed = JSON.parse(autosaveStr);
        const normalized = normalizeAutosave(parsed);
        setHasSavedGame(!!normalized);
      } else {
        setHasSavedGame(false);
      }
    } catch (e) {
      setHasSavedGame(false);
    }
    setScreen('menu');
  };

  // Game complete state triggers XP allocation & Stats logs
  const handleGameCompleted = (timeSec: number, won: boolean, mistakesCount: number = 0) => {
    if (!won) {
      handleGameQuit();
      return;
    }

    const matchDayStr = new Date().toLocaleDateString(undefined, { weekday: 'long' });
    const nowIsoString = new Date().toISOString();
    const randomId = Math.random().toString();
    
    const now = new Date();
    const todayStr = formatLocalDateKey(now);
    const yesterdayStr = getPreviousLocalDateKey(now);

    const context: GameCompletionContext = {
      timeSec,
      mistakesCount,
      gameDifficulty,
      activeDailyDate,
      todayStr,
      yesterdayStr,
      matchDayStr,
      nowIsoString,
      randomId,
    };

    const updatedProfile = updateProfileAfterCompletion(profile, context);
    setProfile(updatedProfile);
    safeStorage.setItem('sudoku_profile', JSON.stringify(updatedProfile));

    const updatedStats = updateStatsAfterCompletion(stats, context);
    setStats(updatedStats);
    safeStorage.setItem('sudoku_stats', JSON.stringify(updatedStats));

    // Clean active gameplay setup
    setActiveBoard(null);
    setActiveDailyDate(null);
    setHasSavedGame(false);
    setScreen('stats'); // Pivot immediately to performance screen for gratification
  };

  const handleClearStats = () => {
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

  const handleUpdateName = (newName: string) => {
    const upProfile = { ...profile, username: newName };
    setProfile(upProfile);
    safeStorage.setItem('sudoku_profile', JSON.stringify(upProfile));
  };

  const handleUpdateAvatar = (newAvatar: string) => {
    const upProfile = { ...profile, avatar: newAvatar };
    setProfile(upProfile);
    safeStorage.setItem('sudoku_profile', JSON.stringify(upProfile));
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#fdfdfd] text-[#1a1c1c] select-none animate-fade-in">
      {/* Desktop NavigationDrawer (Visible on md and up) */}
      {screen !== 'game' && (
        <aside className="hidden md:flex flex-col p-6 gap-4 h-full w-80 fixed left-0 top-0 z-[60] bg-white border-r-2 border-primary">
          <div className="mb-8 mt-2">
            <h2 className="font-headline-md text-headline-md font-bold tracking-tighter text-primary">Sudoku Pro</h2>
          </div>
          <nav className="flex flex-col gap-2 flex-grow">
            <button
              onClick={() => handleTabClick('menu')}
              className={`flex items-center gap-4 px-4 py-3 rounded transition-all duration-200 text-left cursor-pointer font-body-md text-body-md ${
                screen === 'menu' || screen === 'difficulty-settings'
                  ? 'bg-surface-container-low text-primary font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-variant hover:text-primary'
              }`}
            >
              <Grid3X3 className={`w-5 h-5 ${screen === 'menu' || screen === 'difficulty-settings' ? 'text-secondary' : ''}`} />
              <span>New Game</span>
            </button>
            <button
              onClick={() => handleTabClick('daily')}
              className={`flex items-center gap-4 px-4 py-3 rounded transition-all duration-200 text-left cursor-pointer font-body-md text-body-md ${
                screen === 'daily'
                  ? 'bg-surface-container-low text-primary font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-variant hover:text-primary'
              }`}
            >
              <Calendar className={`w-5 h-5 ${screen === 'daily' ? 'text-secondary' : ''}`} />
              <span>Daily Challenge</span>
            </button>
            <button
              onClick={() => handleTabClick('stats')}
              className={`flex items-center gap-4 px-4 py-3 rounded transition-all duration-200 text-left cursor-pointer font-body-md text-body-md ${
                screen === 'stats'
                  ? 'bg-surface-container-low text-primary font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-variant hover:text-primary'
              }`}
            >
              <BarChart3 className={`w-5 h-5 ${screen === 'stats' ? 'text-secondary' : ''}`} />
              <span>Stats</span>
            </button>
            <button
              onClick={() => handleTabClick('profile')}
              className={`flex items-center gap-4 px-4 py-3 rounded transition-all duration-200 text-left cursor-pointer font-body-md text-body-md ${
                screen === 'profile'
                  ? 'bg-surface-container-low text-primary font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-variant hover:text-primary'
              }`}
            >
              <User className={`w-5 h-5 ${screen === 'profile' ? 'text-secondary' : ''}`} />
              <span>Profile</span>
            </button>
          </nav>
        </aside>
      )}

      {/* Mobile TopAppBar (Hidden on md and up) */}
      {screen !== 'game' && (
        <header className="md:hidden w-full bg-white border-b border-[#eeeeee] flex flex-col z-30 shrink-0">
          <div className="flex items-center justify-between px-6 py-4 w-full">
            <button
              onClick={() => handleTabClick('menu')}
              aria-label="Menu"
              className="text-primary hover:bg-neutral-100 transition-colors p-2 rounded-full cursor-pointer flex items-center"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-headline-md text-headline-md font-bold tracking-tighter text-primary select-none">
              Sudoku
            </h1>
            <button
              onClick={() => handleTabClick('difficulty-settings')}
              aria-label="Settings"
              className="text-primary hover:bg-neutral-100 transition-colors p-2 rounded-full cursor-pointer flex items-center"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>
      )}

      {/* Main Screen Canvas Panel */}
      <main className={`flex-grow flex flex-col w-full relative bg-[#fdfdfd] ${screen !== 'game' ? 'pb-16 md:pb-6 md:pl-80' : 'pb-2'}`}>
        {screen === 'menu' && (
          <MenuScreen
            onStartNewGame={handleTriggerStartNew}
            onResumeGame={handleResumePuzzle}
            hasSavedGame={hasSavedGame}
            streak={profile.streak}
            soundEffects={settings.soundEffects}
          />
        )}

        {screen === 'difficulty-settings' && (
          <DifficultySettingsScreen
            difficulty={gameDifficulty}
            onChangeDifficulty={setGameDifficulty}
            settings={settings}
            onChangeSettings={handleUpdateSettings}
            onConfirmStartGame={handleConfirmStart}
          />
        )}

        {screen === 'game' && activeBoard && (
          <GameplayScreen
            initialBoard={activeBoard}
            difficulty={gameDifficulty}
            settings={settings}
            onGameCompleted={handleGameCompleted}
            onQuit={handleGameQuit}
            savedMistakes={savedMistakesCount}
            savedTime={savedSecondsElapsed}
          />
        )}

        {screen === 'daily' && (
          <DailyChallengeScreen
            completedDays={profile.completedDays}
            onPlayDailyChallenge={handlePlayDailyChallenge}
            soundEffects={settings.soundEffects}
          />
        )}

        {screen === 'stats' && (
          <StatsScreen
            stats={stats}
            soundEffects={settings.soundEffects}
          />
        )}

        {screen === 'profile' && (
          <ProfileScreen
            profile={profile}
            stats={stats}
            onUpdateName={handleUpdateName}
            onUpdateAvatar={handleUpdateAvatar}
            onClearStats={handleClearStats}
            onGoToMenu={() => setScreen('menu')}
            soundEffects={settings.soundEffects}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (Hidden on md and up) */}
      {screen !== 'game' && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-around items-center h-16 bg-white/95 backdrop-blur-md border-t border-[#eeeeee] px-4 select-none pb-safe">
          {/* PLAY */}
          <button
            onClick={() => handleTabClick('menu')}
            className={`flex flex-col items-center justify-center cursor-pointer transition-all duration-100 scale-95 w-16 ${
              screen === 'menu' || screen === 'difficulty-settings'
                ? 'text-secondary font-bold'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <Grid3X3 className="w-5 h-5 mb-1" />
            <span className="font-label-caps text-[10px] tracking-wider">PLAY</span>
          </button>

          {/* DAILY */}
          <button
            onClick={() => handleTabClick('daily')}
            className={`flex flex-col items-center justify-center cursor-pointer transition-all duration-100 scale-95 w-16 ${
              screen === 'daily' ? 'text-secondary font-bold' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <Calendar className="w-5 h-5 mb-1" />
            <span className="font-label-caps text-[10px] tracking-wider">DAILY</span>
          </button>

          {/* STATS */}
          <button
            onClick={() => handleTabClick('stats')}
            className={`flex flex-col items-center justify-center cursor-pointer transition-all duration-100 scale-95 w-16 ${
              screen === 'stats' ? 'text-secondary font-bold' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <BarChart3 className="w-5 h-5 mb-1" />
            <span className="font-label-caps text-[10px] tracking-wider">STATS</span>
          </button>

          {/* PROFILE */}
          <button
            onClick={() => handleTabClick('profile')}
            className={`flex flex-col items-center justify-center cursor-pointer transition-all duration-100 scale-95 w-16 ${
              screen === 'profile' ? 'text-secondary font-bold' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <User className="w-5 h-5 mb-1" />
            <span className="font-label-caps text-[10px] tracking-wider">PROFILE</span>
          </button>
        </nav>
      )}

      {isGenerating && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/75 backdrop-blur-md transition-all duration-300 animate-fade-in">
          <div className="flex flex-col items-center gap-6 p-8 rounded-2xl">
            {/* 气流 Loading SVG 动效 */}
            <div className="relative w-24 h-24 flex items-center justify-center">
              {/* 背景静止圆环 - 非常浅的灰色 */}
              <svg className="absolute w-20 h-20 text-neutral-100" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="6" />
              </svg>
              
              {/* 外层主气流环 - 克莱因蓝旋转 (#3654c8) */}
              <svg className="absolute w-20 h-20 animate-spin text-[#3654c8]" viewBox="0 0 100 100" fill="none" style={{ animationDuration: '1.2s' }}>
                <defs>
                  <linearGradient id="kleinAirflow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3654c8" stopOpacity="1" />
                    <stop offset="60%" stopColor="#3654c8" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#3654c8" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="url(#kleinAirflow)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray="180 70"
                />
              </svg>

              {/* 内层反向气流环 - 起到精细科技感，克莱因蓝但更细、反向慢速旋转 */}
              <svg className="absolute w-14 h-14 animate-spin text-[#3654c8]/60" viewBox="0 0 100 100" fill="none" style={{ animationDirection: 'reverse', animationDuration: '2s' }}>
                <defs>
                  <linearGradient id="kleinInner" x1="100%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#3654c8" stopOpacity="0.8" />
                    <stop offset="70%" stopColor="#3654c8" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#3654c8" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="url(#kleinInner)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="120 120"
                />
              </svg>

              {/* 核心微小跳动圆点 - 位于中心，克莱因蓝 */}
              <div className="w-3 h-3 rounded-full bg-[#3654c8] animate-pulse"></div>
            </div>

            {/* 文字与提示 */}
            <div className="flex flex-col items-center gap-2 text-center">
              <h3 className="text-lg font-bold text-[#121212] tracking-tight">
                Generating Puzzle
              </h3>
              <p className="text-sm text-neutral-500 font-medium max-w-[240px] leading-relaxed animate-pulse">
                Analyzing logic paths for unique solution...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
