import { describe, it, expect } from 'vitest';
import { getDailyChallengeConfig, createSeededRng } from './dailyChallenge';
import { generateSudokuBoard } from './sudokuGenerator';
import { solveSudoku, isValidMove } from './sudoku';
import { Cell } from '../types';

describe('Daily Challenge', () => {
  describe('Daily Config', () => {
    it('should return the same config for the same valid date', () => {
      const config1 = getDailyChallengeConfig('2026-06-26');
      const config2 = getDailyChallengeConfig('2026-06-26');
      
      expect(config1).toEqual(config2);
      expect(config1.date).toBe('2026-06-26');
      expect(config1.difficulty).toBe('medium');
    });

    it('should return different seeds for different dates', () => {
      const config1 = getDailyChallengeConfig('2026-06-26');
      const config2 = getDailyChallengeConfig('2026-06-27');
      
      expect(config1.seed).not.toBe(config2.seed);
    });

    it('should maintain the existing date-to-difficulty mapping', () => {
      expect(getDailyChallengeConfig('2026-06-20').difficulty).toBe('expert');
      expect(getDailyChallengeConfig('2026-06-21').difficulty).toBe('easy');
      expect(getDailyChallengeConfig('2026-06-22').difficulty).toBe('medium');
      expect(getDailyChallengeConfig('2026-06-23').difficulty).toBe('hard');
    });

    it('should throw error for invalid date formats', () => {
      expect(() => getDailyChallengeConfig('2026/06/26')).toThrow();
      expect(() => getDailyChallengeConfig('26-06-2026')).toThrow();
      expect(() => getDailyChallengeConfig('invalid')).toThrow();
    });
  });

  describe('Deterministic Generation', () => {
    it('should generate the exact same puzzle and solution for the same date', () => {
      const config = getDailyChallengeConfig('2026-06-25'); // easy difficulty
      
      const rng1 = createSeededRng(config.seed);
      const board1 = generateSudokuBoard(config.difficulty, rng1);
      
      const rng2 = createSeededRng(config.seed);
      const board2 = generateSudokuBoard(config.difficulty, rng2);
      
      const extractRelevant = (b: Cell[][]) => b.map(r => r.map(c => `${c.value}:${c.solvedValue}`));
      expect(extractRelevant(board1)).toEqual(extractRelevant(board2));
    });

    it('should generate a valid solvable 9x9 board with clues matching the solution', () => {
      const config = getDailyChallengeConfig('2026-06-25'); // easy
      const rng = createSeededRng(config.seed);
      const board = generateSudokuBoard(config.difficulty, rng);
      
      expect(board.length).toBe(9);
      expect(board[0].length).toBe(9);
      
      let hasClue = false;
      
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          const cell = board[r][c];
          if (cell.value !== null) {
            hasClue = true;
            expect(cell.value).toBe(cell.solvedValue);
          }
          
          // Verify solution grid validity
          const tempGrid = board.map(row => row.map(cell => cell.solvedValue));
          const val = tempGrid[r][c];
          tempGrid[r][c] = 0;
          expect(isValidMove(tempGrid, r, c, val)).toBe(true);
        }
      }
      expect(hasClue).toBe(true);
      
      // Verify puzzle is uniquely solvable
      const puzzleGrid = board.map(row => row.map(cell => cell.value));
      const { solutions } = solveSudoku(puzzleGrid);
      expect(solutions).toBe(1);
    });
  });

  describe('Random Generation (Backward Compatibility)', () => {
    it('should generate a valid puzzle when no rng is provided', () => {
      const board = generateSudokuBoard('easy');
      
      expect(board.length).toBe(9);
      
      const puzzleGrid = board.map(row => row.map(cell => cell.value));
      const { solutions } = solveSudoku(puzzleGrid);
      expect(solutions).toBe(1);
    });
  });
});
