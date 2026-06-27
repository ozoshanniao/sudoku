import { useState, useEffect } from 'react';
import { Difficulty, Cell } from '../types';
import { generateSudokuAsync } from '../utils/sudoku';
import { getDailyChallengeConfig } from '../utils/dailyChallenge';
import { safeStorage } from '../utils/storage';
import { normalizeAutosave } from '../utils/persistedState';

export function useSudokuSession() {
  const [gameDifficulty, setGameDifficulty] = useState<Difficulty>('medium');
  const [activeBoard, setActiveBoard] = useState<Cell[][] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasSavedGame, setHasSavedGame] = useState(false);
  const [savedMistakesCount, setSavedMistakesCount] = useState(0);
  const [savedSecondsElapsed, setSavedSecondsElapsed] = useState(0);
  const [activeDailyDate, setActiveDailyDate] = useState<string | null>(null);

  useEffect(() => {
    try {
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

  const refreshAutosaveStatus = () => {
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
  };

  const startGame = async (difficulty: Difficulty): Promise<boolean> => {
    setIsGenerating(true);
    try {
      const newBoard = await generateSudokuAsync(difficulty);
      setActiveBoard(newBoard);
      setSavedMistakesCount(0);
      setSavedSecondsElapsed(0);
      return true;
    } catch (error) {
      console.error('Failed to generate sudoku:', error);
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  const resumeGame = (): boolean => {
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
          return true;
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
    return false;
  };

  const startDailyChallenge = async (dateStr: string): Promise<boolean> => {
    setActiveDailyDate(dateStr);
    
    let config;
    try {
      config = getDailyChallengeConfig(dateStr);
    } catch (e) {
      console.error(e);
      return false;
    }

    setGameDifficulty(config.difficulty);
    setIsGenerating(true);
    try {
      const newBoard = await generateSudokuAsync(config.difficulty, config.seed);
      setActiveBoard(newBoard);
      setSavedMistakesCount(0);
      setSavedSecondsElapsed(0);
      return true;
    } catch (error) {
      console.error('Failed to generate daily challenge sudoku:', error);
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  const quitGame = () => {
    setActiveBoard(null);
    setActiveDailyDate(null);
    refreshAutosaveStatus();
  };

  const clearSession = () => {
    setActiveBoard(null);
    setActiveDailyDate(null);
    setHasSavedGame(false);
  };

  return {
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
  };
}
