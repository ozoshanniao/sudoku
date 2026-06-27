import React, { useState, useEffect } from 'react';
import { Grid3X3, Calendar, BarChart3, User, Menu, Settings } from 'lucide-react';
import { Difficulty, Screen, Cell } from './types';
import MenuScreen from './components/MenuScreen';
import DifficultySettingsScreen from './components/DifficultySettingsScreen';
import GameplayScreen from './components/GameplayScreen';
import DailyChallengeScreen from './components/DailyChallengeScreen';
import StatsScreen from './components/StatsScreen';
import ProfileScreen from './components/ProfileScreen';
import { playSound } from './utils/audio';
import { GameCompletionContext } from './utils/playerProgress';
import { formatLocalDateKey, getPreviousLocalDateKey } from './utils/localDate';
import { useGameSettings } from './hooks/useGameSettings';
import { usePlayerProgressState } from './hooks/usePlayerProgressState';
import { useSudokuSession } from './hooks/useSudokuSession';

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const { settings, updateSettings: handleUpdateSettings } = useGameSettings();
  const {
    profile,
    stats,
    updatePlayerName: handleUpdateName,
    updatePlayerAvatar: handleUpdateAvatar,
    clearStats: handleClearStats,
    applyGameCompletion
  } = usePlayerProgressState();

  // Active game states
  const {
    gameDifficulty,
    setGameDifficulty,
    activeBoard,
    isGenerating,
    hasSavedGame,
    savedMistakesCount,
    savedSecondsElapsed,
    activeDailyDate,
    setActiveDailyDate,
    startGame,
    resumeGame,
    startDailyChallenge,
    quitGame,
    clearSession,
  } = useSudokuSession();

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
    const success = await startGame(gameDifficulty);
    if (success) {
      setScreen('game');
    }
  };

  // Resumes previous board state saved automatically
  const handleResumePuzzle = () => {
    const success = resumeGame();
    if (success) {
      setScreen('game');
    }
  };

  // Connects daily challenge dates as custom deterministic games
  const handlePlayDailyChallenge = async (dateStr: string) => {
    const success = await startDailyChallenge(dateStr);
    if (success) {
      setScreen('game');
    }
  };

  const handleGameQuit = () => {
    quitGame();
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

    applyGameCompletion(context);

    // Clean active gameplay setup
    clearSession();
    setScreen('stats'); // Pivot immediately to performance screen for gratification
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
