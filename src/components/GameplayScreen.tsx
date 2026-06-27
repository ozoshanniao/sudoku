import React, { useState, useEffect, useRef, useTransition, useMemo } from 'react';
import { Undo2, Eraser, Pencil, Lightbulb, Delete, Play, Home, AlertCircle, Sparkles, Settings } from 'lucide-react';
import { Cell, Difficulty, GameSettings } from '../types';
import { playSound } from '../utils/audio';
import { safeStorage } from '../utils/storage';
import { motion } from 'motion/react';

interface GameplayScreenProps {
  initialBoard: Cell[][];
  difficulty: Difficulty;
  settings: GameSettings;
  onGameCompleted: (timeSec: number, won: boolean, mistakes?: number) => void;
  onQuit: () => void;
  savedMistakes?: number;
  savedTime?: number;
}

export default function GameplayScreen({
  initialBoard,
  difficulty,
  settings,
  onGameCompleted,
  onQuit,
  savedMistakes = 0,
  savedTime = 0,
}: GameplayScreenProps) {
  // Game states
  const [board, setBoard] = useState<Cell[][]>(() => JSON.parse(JSON.stringify(initialBoard)));
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [mistakes, setMistakes] = useState(savedMistakes);
  const [time, setTime] = useState(savedTime);
  const [isPaused, setIsPaused] = useState(false);
  const [notesMode, setNotesMode] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWon, setIsWon] = useState(false);

  // Undo stack: stores serialized forms of the board
  const [history, setHistory] = useState<string[]>([]);

  // Prevent double transitions
  const [, startTransition] = useTransition();

  // Timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Keep track of total cells completed
  useEffect(() => {
    if (isPaused || isGameOver || isWon) return;

    if (settings.showTimer) {
      timerRef.current = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, isGameOver, isWon, settings.showTimer]);

  // Save puzzle board progress intermittently in safeStorage
  useEffect(() => {
    if (!isGameOver && !isWon) {
      safeStorage.setItem('sudoku_autosave', JSON.stringify({
        board,
        difficulty,
        mistakes,
        time,
        date: new Date().toISOString()
      }));
    }
  }, [board, mistakes, time, difficulty, isGameOver, isWon]);

  // Handle keyboard event triggers for desktop players
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused || isGameOver || isWon) return;

      // Directions arrow-navigation
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        setSelectedCell((prev) => {
          if (!prev) return { row: 4, col: 4 };
          let r = prev.row;
          let c = prev.col;
          if (e.key === 'ArrowUp') r = Math.max(0, r - 1);
          if (e.key === 'ArrowDown') r = Math.min(8, r + 1);
          if (e.key === 'ArrowLeft') c = Math.max(0, c - 1);
          if (e.key === 'ArrowRight') c = Math.min(8, c + 1);
          return { row: r, col: c };
        });
        return;
      }

      // Enter numbers
      if (e.key >= '1' && e.key <= '9') {
        handleInputNumber(parseInt(e.key));
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleErase();
      } else if (e.key.toLowerCase() === 'n') {
        setNotesMode((prev) => !prev);
      } else if (e.key.toLowerCase() === 'u') {
        handleUndo();
      } else if (e.key.toLowerCase() === 'h') {
        handleHint();
      } else if ((import.meta as any).env.DEV && e.ctrlKey && e.shiftKey && e.key === 'Enter') {
        // Dev-only auto-complete shortcut
        const activeElement = document.activeElement;
        const isInputFocused = activeElement && (
          activeElement.tagName === 'INPUT' || 
          activeElement.tagName === 'TEXTAREA' || 
          activeElement.hasAttribute('contenteditable')
        );
        if (!isInputFocused) {
          e.preventDefault();
          const newBoard = JSON.parse(JSON.stringify(board)) as Cell[][];
          let changed = false;
          newBoard.forEach(row => {
            row.forEach(cell => {
              if (!cell.isClue && cell.value !== cell.solvedValue) {
                cell.value = cell.solvedValue;
                cell.notes = [];
                cell.isInvalid = false;
                changed = true;
              }
            });
          });
          if (changed) {
            setBoard(newBoard);
            checkGameCompletion(newBoard);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, board, notesMode, isPaused, isGameOver, isWon, mistakes]);

  // Save current board config into state history stack for Undoing
  const saveStateToHistory = (currentBoard: Cell[][]) => {
    setHistory((prev) => [...prev, JSON.stringify(currentBoard)]);
  };

  const checkGameCompletion = (currentBoard: Cell[][]) => {
    // Game completed if all cells display the correctly solved values
    const allCorrect = currentBoard.every((row) =>
      row.every((cell) => cell.value === cell.solvedValue)
    );

    if (allCorrect) {
      setIsWon(true);
      if (settings.soundEffects) playSound('victory');
      safeStorage.removeItem('sudoku_autosave');
    }
  };

  const handleInputNumber = (num: number) => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    const cell = board[row][col];

    if (cell.isClue) return; // Clues cannot be altered

    saveStateToHistory(board);

    const newBoard = JSON.parse(JSON.stringify(board)) as Cell[][];
    const targetCell = newBoard[row][col];

    if (notesMode) {
      const idx = targetCell.notes.indexOf(num);
      if (idx > -1) {
        targetCell.notes.splice(idx, 1);
      } else {
        targetCell.notes.push(num);
      }
      targetCell.value = null; // Clear number if adding notes
      targetCell.isInvalid = false;
      if (settings.soundEffects) playSound('click');
    } else {
      // Direct number input
      targetCell.value = num;
      targetCell.notes = []; // Clear notes upon active value selection

      if (num !== targetCell.solvedValue) {
        targetCell.isInvalid = true;
        if (settings.soundEffects) playSound('error');

        if (settings.autoCheckMistakes) {
          const nextMistakes = mistakes + 1;
          setMistakes(nextMistakes);
          if (settings.limitMistakes !== false && nextMistakes >= 3) {
            setIsGameOver(true);
            safeStorage.removeItem('sudoku_autosave');
          }
        }
      } else {
        targetCell.isInvalid = false;
        if (settings.soundEffects) playSound('correct');
      }
    }

    setBoard(newBoard);
    checkGameCompletion(newBoard);
  };

  const handleErase = () => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    const cell = board[row][col];
    if (cell.isClue) return;

    saveStateToHistory(board);

    const newBoard = JSON.parse(JSON.stringify(board)) as Cell[][];
    newBoard[row][col].value = null;
    newBoard[row][col].notes = [];
    newBoard[row][col].isInvalid = false;
    
    setBoard(newBoard);
    if (settings.soundEffects) playSound('erase');
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastConfig = history[history.length - 1];
    setBoard(JSON.parse(lastConfig));
    setHistory((prev) => prev.slice(0, prev.length - 1));
    if (settings.soundEffects) playSound('click');
  };

  const handleHint = () => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    const cell = board[row][col];
    if (cell.isClue || cell.value === cell.solvedValue) return;

    saveStateToHistory(board);

    const newBoard = JSON.parse(JSON.stringify(board)) as Cell[][];
    newBoard[row][col].value = newBoard[row][col].solvedValue;
    newBoard[row][col].notes = [];
    newBoard[row][col].isInvalid = false;

    setBoard(newBoard);
    if (settings.soundEffects) playSound('correct');
    checkGameCompletion(newBoard);
  };

  // Check if cell is in row, column, or 3x3 box of selected cell
  const isHighlighted = (r: number, c: number) => {
    if (!selectedCell) return false;
    const { row, col } = selectedCell;
    if (r === row || c === col) return true;
    
    const blockRowStart = Math.floor(row / 3) * 3;
    const blockColStart = Math.floor(col / 3) * 3;
    return r >= blockRowStart && r < blockRowStart + 3 && c >= blockColStart && c < blockColStart + 3;
  };

  // Get active cell value
  const activeCellValue = useMemo(() => {
    if (!selectedCell) return null;
    return board[selectedCell.row][selectedCell.col].value;
  }, [selectedCell, board]);

  // Count how many times each number is correctly placed, return remaining count
  const getRemainingCount = (num: number) => {
    let count = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = board[r][c];
        if (cell.value === num && !cell.isInvalid) {
          count++;
        }
      }
    }
    return Math.max(0, 9 - count);
  };

  // Clock format MM:SS
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRestartGame = () => {
    if (settings.soundEffects) playSound('click');
    setBoard(JSON.parse(JSON.stringify(initialBoard)));
    setSelectedCell(null);
    setMistakes(0);
    setTime(0);
    setIsPaused(false);
    setNotesMode(false);
    setIsGameOver(false);
    setIsWon(false);
    setHistory([]);
  };

  const handleRestartGroup = () => {
    if (settings.soundEffects) playSound('click');
    startTransition(() => {
      onQuit();
    });
  };

  const handleSaveAndQuitGroup = () => {
    if (settings.soundEffects) playSound('click');
    startTransition(() => {
      onQuit();
    });
  };

  return (
    <div className="flex-grow flex flex-col justify-start px-2 py-4 max-w-md mx-auto w-full select-none animate-fade-in pb-2">
      {/* Design Header: menu Sudoku settings */}
      <div className="flex justify-between items-center w-full px-4 py-3 mb-4 border-b border-[#eeeeee] relative">
        {(import.meta as any).env.DEV && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] text-neutral-400 font-mono tracking-tighter whitespace-nowrap opacity-50 pointer-events-none">
            Dev: Ctrl + Shift + Enter 自动完成
          </div>
        )}
        <button
          onClick={handleSaveAndQuitGroup}
          aria-label="Menu"
          className="text-primary hover:bg-neutral-100 transition-colors p-2 rounded-full cursor-pointer flex items-center"
        >
          <Home className="w-5 h-5" />
        </button>
        <span className="font-headline-md text-headline-md font-bold tracking-tighter text-primary">Sudoku</span>
        <button
          onClick={() => setIsPaused(true)}
          aria-label="Settings"
          className="text-primary hover:bg-neutral-100 transition-colors p-2 rounded-full cursor-pointer flex items-center"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Top Header Information Panel */}
      <div className="grid grid-cols-3 w-full px-2 mb-4">
        <div className="flex flex-col text-left">
          <span className="font-label-caps text-label-caps text-on-surface-variant">DIFFICULTY</span>
          <span className="font-body-md text-body-md font-medium text-primary capitalize">{difficulty}</span>
        </div>
        <div className="flex flex-col items-center text-center">
          <span className="font-label-caps text-label-caps text-on-surface-variant">MISTAKES</span>
          <motion.span
            key={mistakes}
            animate={mistakes > 0 ? { scale: [1, 1.35, 1], color: ['#121212', '#ff0000', '#ba1a1a'] } : {}}
            transition={{ duration: 0.3 }}
            className={`font-body-md text-body-md font-medium ${mistakes > 0 ? 'text-red-600' : 'text-primary'}`}
          >
            {settings.limitMistakes !== false ? `${mistakes}/3` : mistakes}
          </motion.span>
        </div>
        <div className="flex flex-col items-end text-right">
          <span className="font-label-caps text-label-caps text-on-surface-variant">TIME</span>
          <span className="font-body-md text-body-md font-medium text-primary">
            {settings.showTimer ? formatTime(time) : '--:--'}
          </span>
        </div>
      </div>

      {/* Main Board Container */}
      <div className="relative w-full aspect-square bg-[#e2e2e2] rounded-xl overflow-hidden shadow-sm border border-gray-300">
        {/* Custom thicker lines layer for the 3x3 grids */}
        <div className="absolute left-1/3 top-0 bottom-0 w-[2px] bg-gray-400 pointer-events-none z-10" />
        <div className="absolute left-2/3 top-0 bottom-0 w-[2px] bg-gray-400 pointer-events-none z-10" />
        <div className="absolute top-1/3 left-0 right-0 h-[2px] bg-gray-400 pointer-events-none z-10" />
        <div className="absolute top-2/3 left-0 right-0 h-[2px] bg-gray-400 pointer-events-none z-10" />

        <div className="grid grid-cols-9 grid-rows-9 gap-[1px] h-full w-full">
          {board.map((rowArr, rIdx) =>
            rowArr.map((cellObj, cIdx) => {
              const { value, isClue, notes, isInvalid } = cellObj;
              const isSelected = selectedCell?.row === rIdx && selectedCell?.col === cIdx;
              const isNeighbour = isHighlighted(rIdx, cIdx);
              const isSameDigit = value && value === activeCellValue;

              // Compute background color
              let bgClass = 'bg-white';
              if (isSelected) {
                bgClass = 'bg-secondary-container'; // #e8ecff
              } else if (isSameDigit) {
                bgClass = 'bg-[#dbe2ff]'; 
              } else if (isNeighbour) {
                bgClass = 'bg-[#f5f5f5]'; 
              }

              // Compute text color
              let textClass = 'cell-clue text-on-surface';
              if (isInvalid) {
                textClass = 'text-red-600 font-bold';
              } else if (!isClue) {
                textClass = 'cell-user text-secondary font-semibold';
              }

              return (
                <motion.div
                  key={`${rIdx}-${cIdx}`}
                  onClick={() => {
                    if (isPaused) return;
                    if (settings.soundEffects) playSound('click');
                    setSelectedCell({ row: rIdx, col: cIdx });
                  }}
                  animate={isInvalid ? { x: [-8, 8, -5, 5, -2, 2, 0] } : {}}
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                  className={`relative flex items-center justify-center cursor-pointer transition-colors duration-200 select-none h-full w-full ${bgClass}`}
                  id={`cell-${rIdx}-${cIdx}`}
                >
                  {value !== null ? (
                    <motion.span
                      key={value}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: [0.6, 1.25, 1], opacity: 1 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className={`font-display-cell-mobile text-display-cell-mobile ${textClass}`}
                    >
                      {value}
                    </motion.span>
                  ) : (
                    /* Render Pencil notes in a 3x3 sub-grid */
                    <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-[1px] font-note-cell text-note-cell leading-none text-on-surface-variant opacity-80">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                        <div key={n} className="flex items-center justify-center">
                          {notes.includes(n) ? n : ''}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>

        {/* Paused Overlay */}
        {isPaused && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center z-20 space-y-6">
            <span className="text-xl font-bold text-primary select-none">Puzzles Paused</span>
            <div className="flex flex-wrap justify-center gap-3 px-4">
              <button
                onClick={() => setIsPaused(false)}
                className="bg-secondary text-white px-5 py-3 rounded-xl font-semibold text-xs tracking-wider cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all"
              >
                RESUME
              </button>
              <button
                onClick={handleRestartGame}
                className="border border-secondary text-secondary px-5 py-3 rounded-xl font-semibold text-xs tracking-wider cursor-pointer hover:bg-secondary/5 active:scale-[0.98] transition-all"
              >
                RESTART
              </button>
              <button
                onClick={handleSaveAndQuitGroup}
                className="bg-[#eeeeee] text-primary px-5 py-3 rounded-xl font-semibold text-xs tracking-wider cursor-pointer hover:bg-gray-200 active:scale-[0.98] transition-all"
              >
                SAVE & QUIT
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tools Row below board grid */}
      <div className="grid grid-cols-4 gap-2 w-full px-2 mt-4">
        {/* Undo */}
        <button
          onClick={handleUndo}
          disabled={history.length === 0}
          className={`flex flex-col items-center justify-center py-3 px-1 rounded-2xl transition-colors cursor-pointer ${
            history.length > 0
              ? 'bg-surface-variant/50 text-on-surface-variant hover:bg-surface-variant active:bg-outline-variant'
              : 'bg-surface-variant/20 text-on-surface-variant/40 cursor-not-allowed'
          }`}
          id="tool-undo"
        >
          <Undo2 className="w-5 h-5 mb-1" />
          <span className="font-label-caps text-label-caps tracking-wider text-[10px]">UNDO</span>
        </button>

        {/* Erase */}
        <button
          onClick={handleErase}
          disabled={!selectedCell || board[selectedCell.row][selectedCell.col].isClue}
          className={`flex flex-col items-center justify-center py-3 px-1 rounded-2xl transition-colors cursor-pointer ${
            selectedCell && !board[selectedCell.row][selectedCell.col].isClue
              ? 'bg-surface-variant/50 text-on-surface-variant hover:bg-surface-variant active:bg-outline-variant'
              : 'bg-surface-variant/20 text-on-surface-variant/40 cursor-not-allowed'
          }`}
          id="tool-erase"
        >
          <Eraser className="w-5 h-5 mb-1" />
          <span className="font-label-caps text-label-caps tracking-wider text-[10px]">ERASE</span>
        </button>

        {/* Notes Toggle */}
        <button
          onClick={() => setNotesMode(!notesMode)}
          className={`flex flex-col items-center justify-center py-3 px-1 rounded-2xl transition-colors cursor-pointer ${
            notesMode
              ? 'bg-secondary text-white font-semibold'
              : 'bg-surface-variant/50 text-on-surface-variant hover:bg-surface-variant active:bg-outline-variant'
          }`}
          id="tool-notes"
        >
          <Pencil className="w-5 h-5 mb-1" />
          <span className="font-label-caps text-label-caps tracking-wider text-[10px]">NOTES</span>
        </button>

        {/* Hint */}
        <button
          onClick={handleHint}
          disabled={!selectedCell || board[selectedCell.row][selectedCell.col].isClue || board[selectedCell.row][selectedCell.col].value === board[selectedCell.row][selectedCell.col].solvedValue}
          className={`flex flex-col items-center justify-center py-3 px-1 rounded-2xl transition-colors cursor-pointer ${
            selectedCell && !board[selectedCell.row][selectedCell.col].isClue && board[selectedCell.row][selectedCell.col].value !== board[selectedCell.row][selectedCell.col].solvedValue
              ? 'bg-surface-variant/50 text-on-surface-variant hover:bg-surface-variant active:bg-outline-variant'
              : 'bg-surface-variant/20 text-on-surface-variant/40 cursor-not-allowed'
          }`}
          id="tool-hint"
        >
          <Lightbulb className="w-5 h-5 mb-1" />
          <span className="font-label-caps text-label-caps tracking-wider text-[10px]">HINT</span>
        </button>
      </div>

      {/* Custom Numpad Panel */}
      <div className="grid grid-cols-5 gap-3 w-full px-2 mb-10 mt-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
          const remaining = getRemainingCount(num);
          const isDisabled = remaining === 0;
          
          return (
            <button
              key={num}
              onClick={() => handleInputNumber(num)}
              disabled={isDisabled}
              className={`shadow-sm rounded-xl flex flex-col items-center justify-center transition-all duration-200 select-none h-14 ${
                isDisabled
                  ? 'bg-neutral-100 text-neutral-300 cursor-not-allowed shadow-none'
                  : 'bg-white text-primary hover:bg-surface-variant active:bg-outline-variant hover:shadow-md cursor-pointer'
              }`}
            >
              <span className={`font-display-cell-mobile text-display-cell-mobile leading-none ${isDisabled ? 'text-neutral-300' : 'mb-0.5'}`}>
                {num}
              </span>
              
              {!isDisabled && (
                <div className="flex gap-[2px] justify-center items-center h-1.5 mt-0.5 max-w-full overflow-hidden px-1">
                  {Array.from({ length: remaining }).map((_, i) => (
                    <div
                      key={i}
                      className="w-[3px] h-[3px] rounded-full bg-secondary flex-shrink-0"
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
        {/* Erase button mapping as Numpad Backspace */}
        <button
          onClick={handleErase}
          className="bg-white hover:bg-surface-variant active:bg-outline-variant shadow-sm rounded-xl text-on-surface-variant h-14 flex items-center justify-center cursor-pointer transition-all hover:shadow-md"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>

      {/* GameOver Modal Overlay Component */}
      {isGameOver && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl border-2 border-primary animate-scale-up">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-600 mb-2 select-none">Game Over</h2>
            <p className="text-sm text-on-surface-variant mb-6 select-none">
              You've made 3 mistakes. Would you like to retry this puzzle or go back to menu?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleRestartGame}
                className="bg-secondary text-white py-3.5 px-4 rounded-xl font-bold text-sm tracking-widest hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
              >
                RETRY PUZZLE
              </button>
              <button
                onClick={handleRestartGroup}
                className="bg-[#eeeeee] text-primary py-3.5 px-4 rounded-xl font-bold text-sm tracking-widest hover:bg-gray-200 active:scale-[0.98] transition-all cursor-pointer"
              >
                BACK TO MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Victory Celebration Overlay */}
      {isWon && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[100] p-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className="bg-white rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl border-2 border-secondary relative overflow-hidden"
          >
            <ConfettiEffect />
            
            {/* Confetti-like Sparkle sparkles on complete */}
            <div className="absolute top-2 left-4 animate-bounce">
              <Sparkles className="w-6 h-6 text-yellow-500" />
            </div>
            <div className="absolute top-12 right-6 animate-pulse">
              <Sparkles className="w-5 h-5 text-yellow-500" />
            </div>

            <AwardBadge />
            
            <h2 className="text-2xl font-black text-secondary mb-2 select-none">Sudoku Solved!</h2>
            <p className="text-sm text-[#444748] mb-1 select-none">
              Incredible solve time: <strong className="font-mono text-black font-semibold">{formatTime(time)}</strong>
            </p>
            <p className="text-xs text-[#868381] mb-6 select-none uppercase tracking-wider font-semibold">
              Difficulty: {difficulty} • +{difficulty === 'easy' ? 100 : difficulty === 'medium' ? 200 : difficulty === 'hard' ? 300 : 400} XP
            </p>

            <button
              onClick={() => onGameCompleted(time, true, mistakes)}
              className="w-full bg-secondary text-white py-4 rounded-xl font-bold text-sm tracking-widest hover:opacity-95 cursor-pointer shadow-md"
            >
              CONTINUE TO STATS
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

function ConfettiEffect() {
  const colors = ['#3654c8', '#ff7b00', '#00f5d4', '#fee440', '#70e000', '#ff007f'];
  const particles = Array.from({ length: 45 }, (_, i) => ({
    id: i,
    x: Math.random() * 240 - 120, // Spread range left/right
    y: Math.random() * -240 - 80,  // Project upwards
    rot: Math.random() * 360,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 6 + 6,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 120, rotate: 0, opacity: 1 }}
          animate={{
            x: p.x,
            y: [120, p.y, 450], // Project upward, then fall offscreen
            rotate: p.rot + 360,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 2.0,
            ease: 'easeOut',
            delay: Math.random() * 0.15,
          }}
          style={{
            position: 'absolute',
            left: '50%',
            top: '30%',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
}

function AwardBadge() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
      className="w-20 h-20 bg-secondary/11 rounded-full flex items-center justify-center mx-auto mb-4 border border-secondary/30"
    >
      <Sparkles className="w-10 h-10 text-secondary animate-pulse" />
    </motion.div>
  );
}

