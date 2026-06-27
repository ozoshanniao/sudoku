import { useState, useEffect, useCallback } from 'react';
import { GameSettings } from '../types';
import { safeStorage } from '../utils/storage';
import { normalizeSettings } from '../utils/persistedState';

const DEFAULT_SETTINGS: GameSettings = {
  soundEffects: true,
  showTimer: true,
  autoCheckMistakes: true,
  limitMistakes: true,
};

export function useGameSettings() {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);

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
    } catch (err) {
      console.warn('Local Storage load fail (Settings):', err);
    }
  }, []);

  const updateSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    safeStorage.setItem('sudoku_settings', JSON.stringify(newSettings));
  };

  return {
    settings,
    updateSettings,
  };
}
