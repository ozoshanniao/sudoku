import React, { useState, useTransition, useMemo } from 'react';
import { Calendar as CalendarIcon, Star, CheckCircle, Lock, Play } from 'lucide-react';
import { GameSettings } from '../types';
import { playSound } from '../utils/audio';
import { motion } from 'motion/react';

interface DailyChallengeScreenProps {
  completedDays: string[]; // dates like '2026-06-22'
  onPlayDailyChallenge: (dateStr: string) => void;
  soundEffects: boolean;
  language: GameSettings['language'];
}

export default function DailyChallengeScreen({
  completedDays,
  onPlayDailyChallenge,
  soundEffects,
  language,
}: DailyChallengeScreenProps) {
  const isChinese = language === 'zh';
  const safeCompletedDays = Array.isArray(completedDays) ? completedDays : [];
  const today = new Date();

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonthIdx, setViewMonthIdx] = useState(today.getMonth());

  const formatDateStr = (y: number, m: number, d: number) => {
    return `${y}-${(m + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
  };

  const [selectedDateStr, setSelectedDateStr] = useState<string>(() =>
    formatDateStr(today.getFullYear(), today.getMonth(), today.getDate())
  );
  
  const [, startTransition] = useTransition();

  const monthNames = isChinese
    ? ['1\u6708', '2\u6708', '3\u6708', '4\u6708', '5\u6708', '6\u6708', '7\u6708', '8\u6708', '9\u6708', '10\u6708', '11\u6708', '12\u6708']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const weekdayLabels = isChinese ? ['\u65e5', '\u4e00', '\u4e8c', '\u4e09', '\u56db', '\u4e94', '\u516d'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const daysInMonth = new Date(viewYear, viewMonthIdx + 1, 0).getDate();
  const startDayOfWeek = new Date(viewYear, viewMonthIdx, 1).getDay();

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

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

  const isChallengeCompleted = safeCompletedDays.includes(selectedDateStr);

  const completedDaysCountThisMonth = useMemo(() => {
    const prefix = `${viewYear}-${(viewMonthIdx + 1).toString().padStart(2, '0')}`;
    return safeCompletedDays.filter((d) => d.startsWith(prefix)).length;
  }, [safeCompletedDays, viewYear, viewMonthIdx]);

  const selectedMonthName = monthNames[parseInt(selectedDateStr.split('-')[1]) - 1];
  const selectedDay = parseInt(selectedDateStr.split('-')[2]);
  const selectedYear = selectedDateStr.split('-')[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex-grow px-4 py-8 max-w-md mx-auto w-full flex flex-col gap-6 pb-6"
    >
      <div className="text-center pb-4 border-b border-[#eeeeee]">
        <h2 className="text-xl font-bold text-primary flex items-center justify-center gap-2 uppercase tracking-wider">
          <CalendarIcon className="w-5 h-5 text-secondary" />
          {isChinese ? '\u6bcf\u65e5\u6311\u6218' : 'Daily Challenge'}
        </h2>
        <p className="text-xs text-on-surface-variant mt-1.5 uppercase tracking-wide font-extrabold">
          {isChinese ? '\u5b8c\u6210\u65e5\u5386\u68cb\u5c40' : 'Solve calendar puzzles'}
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-xs border border-[#eeeeee]">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-lg border border-gray-200 text-[#444748] hover:bg-[#f5f5f5] active:scale-95 transition-all cursor-pointer flex items-center justify-center w-8 h-8"
              aria-label={isChinese ? '\u4e0a\u4e2a\u6708' : 'Previous Month'}
            >
              <span className="font-bold text-sm select-none">&lt;</span>
            </button>
            <span className="text-sm font-extrabold text-primary min-w-[110px] text-center select-none">
              {monthNames[viewMonthIdx]} {viewYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-lg border border-gray-200 text-[#444748] hover:bg-[#f5f5f5] active:scale-95 transition-all cursor-pointer flex items-center justify-center w-8 h-8"
              aria-label={isChinese ? '\u4e0b\u4e2a\u6708' : 'Next Month'}
            >
              <span className="font-bold text-sm select-none">&gt;</span>
            </button>
          </div>
          <span className="text-xs text-secondary font-black uppercase tracking-wider bg-secondary/11 px-2.5 py-1 rounded-full">
            {isChinese ? `${completedDaysCountThisMonth} \u5df2\u5b8c\u6210` : `${completedDaysCountThisMonth} solved`}
          </span>
        </div>

        <div className="grid grid-cols-7 text-center text-xs font-semibold text-[#444748] mb-3 uppercase">
          {weekdayLabels.map((day) => <span key={day}>{day}</span>)}
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center">
          {calendarDays.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="aspect-square" />;
            }

            const dateStr = formatDateStr(viewYear, viewMonthIdx, day);
            const isCompleted = safeCompletedDays.includes(dateStr);
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

      {selectedDateStr && (
        <div className="bg-white p-6 rounded-xl border border-[#eeeeee] shadow-xs flex flex-col gap-4">
          <div className="flex justify-between items-start border-b border-[#eeeeee] pb-4">
            <div>
              <span className="text-xs font-semibold text-[#444748] block uppercase tracking-wider leading-none mb-1">
                {isChinese ? '\u6311\u6218\u65e5\u671f' : 'CHALLENGE FOR'}
              </span>
              <span className="text-base font-extrabold text-primary font-mono leading-tight">
                {selectedMonthName} {selectedDay}, {selectedYear}
              </span>
            </div>
            {isChallengeCompleted ? (
              <span className="flex items-center gap-1 text-xs text-green-600 font-extrabold bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                <CheckCircle className="w-3 h-3" /> {isChinese ? '\u5df2\u5b8c\u6210' : 'Checked'}
              </span>
            ) : (
              <span className="text-xs text-[#868381] bg-neutral-100 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border border-neutral-200">
                {isChinese ? '\u672a\u5b8c\u6210' : 'Unsolved'}
              </span>
            )}
          </div>

          <p className="text-sm text-[#444748] leading-relaxed">
            {isChinese
              ? `\u4e3a ${selectedMonthName} ${selectedDay} \u751f\u6210\u7684\u5bf9\u79f0\u6570\u72ec\u68cb\u5c40\u3002${isChallengeCompleted ? ' \u4f60\u5df2\u7ecf\u5b8c\u6210\u8fc7\u8fd9\u4e2a\u68cb\u5c40\uff0c\u53ef\u4ee5\u91cd\u73a9\u6765\u5237\u65b0\u7edf\u8ba1\u3002' : ' \u5b8c\u6210\u672c\u5c40\u53ef\u589e\u52a0\u8fde\u80dc\u5e76\u89e3\u9501\u5b63\u8282\u5fbd\u7ae0\u3002'}`
              : `A specialized symmetric puzzle generated deterministically for ${selectedMonthName} ${selectedDay}. ${isChallengeCompleted ? "You've already solved this puzzle! You can replay it to boost statistics." : 'Win this board to increase streak and win exclusive seasonal badges!'}`}
          </p>

          <button
            onClick={() => handlePlayDailyChallenge(selectedDateStr)}
            className="w-full bg-secondary text-white font-extrabold py-3.5 rounded-full flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer text-sm tracking-widest uppercase shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isChallengeCompleted ? (isChinese ? '\u91cd\u73a9\u6311\u6218' : 'REPLAY CHALLENGE') : (isChinese ? '\u5f00\u59cb\u6311\u6218' : 'PLAY CHALLENGE')}</span>
          </button>
        </div>
      )}
    </motion.div>
  );
}
