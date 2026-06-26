import React, { useState, useTransition, useMemo } from 'react';
import { Calendar as CalendarIcon, Star, CheckCircle, Lock, Play } from 'lucide-react';
import { playSound } from '../utils/audio';
import { motion } from 'motion/react';

interface DailyChallengeScreenProps {
  completedDays: string[]; // dates like '2026-06-22'
  onPlayDailyChallenge: (dateStr: string) => void;
  soundEffects: boolean;
}

export default function DailyChallengeScreen({
  completedDays,
  onPlayDailyChallenge,
  soundEffects,
}: DailyChallengeScreenProps) {
  const today = new Date();

  // Calendar browsing states (defaults to current year/month)
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonthIdx, setViewMonthIdx] = useState(today.getMonth());

  // Selected date state (defaults to today's date string)
  const formatDateStr = (y: number, m: number, d: number) => {
    return `${y}-${(m + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
  };

  const [selectedDateStr, setSelectedDateStr] = useState<string>(() =>
    formatDateStr(today.getFullYear(), today.getMonth(), today.getDate())
  );
  
  const [, startTransition] = useTransition();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helper to generate days of the view month
  const daysInMonth = new Date(viewYear, viewMonthIdx + 1, 0).getDate();
  const startDayOfWeek = new Date(viewYear, viewMonthIdx, 1).getDay();

  const calendarDays: (number | null)[] = [];
  // Empty slots for padding
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  // Switch month handlers
  const handlePrevMonth = () => {
    if (soundEffects) playSound('click');
    setViewMonthIdx((prev) => {
      if (prev === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    if (soundEffects) playSound('click');
    setViewMonthIdx((prev) => {
      if (prev === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const handleDateClick = (dayNum: number | null) => {
    if (!dayNum) return;
    const dateStr = formatDateStr(viewYear, viewMonthIdx, dayNum);

    const checkDateReset = new Date(viewYear, viewMonthIdx, dayNum);
    const todayReset = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isFuture = checkDateReset > todayReset;

    if (isFuture) return;

    if (soundEffects) playSound('click');
    setSelectedDateStr(dateStr);
  };

  const handlePlayDailyChallenge = (dateStr: string) => {
    if (soundEffects) playSound('click');
    startTransition(() => {
      onPlayDailyChallenge(dateStr);
    });
  };

  const isChallengeCompleted = completedDays.includes(selectedDateStr);

  // Compute solved challenges count for the viewed month
  const completedDaysCountThisMonth = useMemo(() => {
    const prefix = `${viewYear}-${(viewMonthIdx + 1).toString().padStart(2, '0')}`;
    return completedDays.filter((d) => d.startsWith(prefix)).length;
  }, [completedDays, viewYear, viewMonthIdx]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex-grow px-4 py-8 max-w-md mx-auto w-full flex flex-col gap-6 pb-6"
    >
      {/* Daily Challenge Title Header */}
      <div className="text-center pb-4 border-b border-[#eeeeee]">
        <h2 className="text-xl font-bold text-primary flex items-center justify-center gap-2 uppercase tracking-wider">
          <CalendarIcon className="w-5 h-5 text-secondary" />
          Daily Challenge
        </h2>
        <p className="text-xs text-on-surface-variant mt-1.5 uppercase tracking-wide font-extrabold">
          Solve calendar puzzles
        </p>
      </div>

      {/* Month Calendar View Grid */}
      <div className="bg-white p-6 rounded-xl shadow-xs border border-[#eeeeee]">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-lg border border-gray-200 text-[#444748] hover:bg-[#f5f5f5] active:scale-95 transition-all cursor-pointer flex items-center justify-center w-8 h-8"
              aria-label="Previous Month"
            >
              <span className="font-bold text-sm select-none">‹</span>
            </button>
            <span className="text-sm font-extrabold text-primary min-w-[110px] text-center select-none">
              {monthNames[viewMonthIdx]} {viewYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-lg border border-gray-200 text-[#444748] hover:bg-[#f5f5f5] active:scale-95 transition-all cursor-pointer flex items-center justify-center w-8 h-8"
              aria-label="Next Month"
            >
              <span className="font-bold text-sm select-none">›</span>
            </button>
          </div>
          <span className="text-xs text-secondary font-black uppercase tracking-wider bg-secondary/11 px-2.5 py-1 rounded-full">
            {completedDaysCountThisMonth} solved
          </span>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 text-center text-xs font-semibold text-[#444748] mb-3 uppercase">
          <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
        </div>

        {/* Calendar days mapping */}
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {calendarDays.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="aspect-square" />;
            }

            const dateStr = formatDateStr(viewYear, viewMonthIdx, day);
            const isCompleted = completedDays.includes(dateStr);
            const isSelected = selectedDateStr === dateStr;

            const checkDateReset = new Date(viewYear, viewMonthIdx, day);
            const todayReset = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const isFuture = checkDateReset > todayReset;

            let cellClass = 'bg-[#f5f5f5] text-on-surface hover:bg-[#e2e2e2]';
            if (isFuture) {
              cellClass = 'bg-gray-100 text-gray-300 cursor-not-allowed opacity-45';
            } else if (isSelected) {
              cellClass = 'bg-[#e8ecff] text-secondary font-bold ring-2 ring-secondary ring-inset';
            } else if (isCompleted) {
              cellClass = 'bg-yellow-50 text-yellow-600 border border-yellow-200';
            }

            return (
              <button
                key={`day-${day}`}
                disabled={isFuture}
                onClick={() => handleDateClick(day)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center relative p-1 group transition-all duration-200 cursor-pointer ${cellClass}`}
              >
                <span className="text-sm font-semibold">{day}</span>
                {isCompleted && (
                  <Star className="w-2.5 h-2.5 text-yellow-500 fill-current animate-pulse mt-0.5" />
                )}
                {isFuture && (
                  <Lock className="w-3 h-3 text-gray-300 absolute bottom-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Puzzle Detail Frame */}
      {selectedDateStr && (
        <div className="bg-white p-6 rounded-xl border border-[#eeeeee] shadow-xs flex flex-col gap-4">
          <div className="flex justify-between items-start border-b border-[#eeeeee] pb-4">
            <div>
              <span className="text-xs font-semibold text-[#444748] block uppercase tracking-wider leading-none mb-1">CHALLENGE FOR</span>
              <span className="text-base font-extrabold text-primary font-mono leading-tight">
                {monthNames[parseInt(selectedDateStr.split('-')[1]) - 1]} {parseInt(selectedDateStr.split('-')[2])}, {selectedDateStr.split('-')[0]}
              </span>
            </div>
            {isChallengeCompleted ? (
              <span className="flex items-center gap-1 text-xs text-green-600 font-extrabold bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                <CheckCircle className="w-3 h-3" /> Checked
              </span>
            ) : (
              <span className="text-xs text-[#868381] bg-neutral-100 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border border-neutral-200">
                Unsolved
              </span>
            )}
          </div>

          <p className="text-sm text-[#444748] leading-relaxed">
            A specialized symmetric puzzle generated deterministically for {monthNames[parseInt(selectedDateStr.split('-')[1]) - 1]} {parseInt(selectedDateStr.split('-')[2])}. 
            {isChallengeCompleted 
              ? " You've already solved this puzzle! You can replay it to boost statistics." 
              : " Win this board to increase streak and win exclusive seasonal badges!"
            }
          </p>

          <button
            onClick={() => handlePlayDailyChallenge(selectedDateStr)}
            className="w-full bg-secondary text-white font-extrabold py-3.5 rounded-full flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer text-sm tracking-widest uppercase shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isChallengeCompleted ? "REPLAY CHALLENGE" : "PLAY CHALLENGE"}</span>
          </button>
        </div>
      )}
    </motion.div>
  );
}
