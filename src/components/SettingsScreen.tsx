import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, RotateCcw, ShieldAlert, Timer, Volume2 } from 'lucide-react';
import { motion } from 'motion/react';
import { GameSettings } from '../types';
import { playSound } from '../utils/audio';

interface SettingsScreenProps {
  settings: GameSettings;
  onChangeSettings: (settings: GameSettings) => void;
  onClearStats: () => void;
  onResetComplete: () => void;
}

interface SettingToggleProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}

function SettingToggle({
  id,
  icon,
  title,
  description,
  enabled,
  onToggle,
}: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-[#eeeeee] shadow-sm">
      <div className="flex items-start gap-4 min-w-0">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-surface-container-low flex items-center justify-center text-on-surface-variant">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="font-body-md text-body-md font-semibold text-primary">{title}</h3>
          <p className="text-xs leading-relaxed text-on-surface-variant mt-0.5">{description}</p>
        </div>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={title}
        onClick={onToggle}
        className={'w-12 h-6 shrink-0 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary ' + (enabled ? 'bg-secondary' : 'bg-[#c4c7c7]')}
      >
        <span
          className={'bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-300 ' + (enabled ? 'translate-x-6' : 'translate-x-0')}
        />
      </button>
    </div>
  );
}

export default function SettingsScreen({
  settings,
  onChangeSettings,
  onClearStats,
  onResetComplete,
}: SettingsScreenProps) {
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  const updateSetting = (nextSettings: GameSettings) => {
    if (nextSettings.soundEffects) playSound('click');
    onChangeSettings(nextSettings);
  };

  const handleReset = () => {
    if (settings.soundEffects) playSound('click');
    onClearStats();
    setIsConfirmingReset(false);
    onResetComplete();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex-grow w-full max-w-2xl mx-auto px-6 py-8 pb-8"
    >
      <header className="mb-8">
        <p className="font-label-caps text-label-caps text-secondary mb-2">PREFERENCES</p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary">Settings</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2">
          Customize how every puzzle looks, sounds, and responds.
        </p>
      </header>

      <section aria-labelledby="gameplay-settings-title">
        <div className="mb-4">
          <h3 id="gameplay-settings-title" className="font-headline-md text-headline-md text-primary">Gameplay</h3>
          <p className="text-sm text-on-surface-variant mt-1">These preferences are saved automatically.</p>
        </div>

        <div className="flex flex-col gap-3">
          <SettingToggle
            id="sound_toggle_action"
            icon={<Volume2 className="w-5 h-5" />}
            title="Sound Effects"
            description="Play subtle feedback sounds for actions and results."
            enabled={settings.soundEffects}
            onToggle={() => updateSetting({ ...settings, soundEffects: !settings.soundEffects })}
          />
          <SettingToggle
            id="timer_toggle_action"
            icon={<Timer className="w-5 h-5" />}
            title="Show Timer"
            description="Display elapsed time while solving a puzzle."
            enabled={settings.showTimer}
            onToggle={() => updateSetting({ ...settings, showTimer: !settings.showTimer })}
          />
          <SettingToggle
            id="autocheck_toggle_action"
            icon={<CheckCircle2 className="w-5 h-5" />}
            title="Auto-check Mistakes"
            description="Highlight incorrect entries as soon as they are placed."
            enabled={settings.autoCheckMistakes}
            onToggle={() => updateSetting({ ...settings, autoCheckMistakes: !settings.autoCheckMistakes })}
          />
          <SettingToggle
            id="limit_mistakes_toggle_action"
            icon={<AlertCircle className="w-5 h-5" />}
            title="Limit Mistakes"
            description="End the puzzle after three incorrect entries."
            enabled={settings.limitMistakes !== false}
            onToggle={() => updateSetting({ ...settings, limitMistakes: settings.limitMistakes === false })}
          />
        </div>
      </section>

      <section aria-labelledby="danger-zone-title" className="mt-10">
        <div className="rounded-2xl border border-red-200 bg-white overflow-hidden shadow-sm">
          <div className="p-5 border-b border-red-100 bg-red-50/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <p className="font-label-caps text-label-caps text-red-600">DANGER ZONE</p>
                <h3 id="danger-zone-title" className="font-headline-md text-headline-md text-primary mt-0.5">Reset progress</h3>
              </div>
            </div>
          </div>
          <div className="p-5">
            <p className="text-sm leading-relaxed text-on-surface-variant">
              Permanently clear statistics, level progress, XP, streaks, daily completions, and achievements.
            </p>
            <button
              type="button"
              onClick={() => {
                if (settings.soundEffects) playSound('click');
                setIsConfirmingReset(true);
              }}
              className="mt-5 w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-red-300 hover:bg-red-50 active:bg-red-100 text-red-600 px-5 py-3 rounded-xl font-bold text-sm tracking-wide cursor-pointer transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset All Statistics
            </button>
          </div>
        </div>
      </section>

      {isConfirmingReset && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6 animate-fade-in">
          <div role="alertdialog" aria-modal="true" aria-labelledby="reset-dialog-title" className="bg-white rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl border border-red-100 animate-scale-up">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 id="reset-dialog-title" className="text-lg font-bold text-primary mb-2">Reset All Progress?</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
              This action is permanent and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  if (settings.soundEffects) playSound('click');
                  setIsConfirmingReset(false);
                }}
                className="flex-1 bg-surface-variant hover:bg-surface-container-high text-primary py-3 rounded-xl font-bold text-xs tracking-wider transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-xs tracking-wider transition-colors cursor-pointer shadow-md"
              >
                RESET DATA
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
