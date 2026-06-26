import { describe, it, expect } from 'vitest';
import { isValidMove, solveSudoku } from './sudoku';

describe('Sudoku Logic - isValidMove', () => {
  it('should allow valid moves on an empty board', () => {
    const emptyBoard = Array.from({ length: 9 }, () => Array(9).fill(0));
    expect(isValidMove(emptyBoard, 0, 0, 1)).toBe(true);
    expect(isValidMove(emptyBoard, 8, 8, 9)).toBe(true);
  });

  it('should reject numbers already present in the same row', () => {
    const board = Array.from({ length: 9 }, () => Array(9).fill(0));
    board[0][0] = 5;
    expect(isValidMove(board, 0, 1, 5)).toBe(false);
    expect(isValidMove(board, 0, 8, 5)).toBe(false);
  });

  it('should reject numbers already present in the same column', () => {
    const board = Array.from({ length: 9 }, () => Array(9).fill(0));
    board[0][2] = 7;
    expect(isValidMove(board, 1, 2, 7)).toBe(false);
    expect(isValidMove(board, 8, 2, 7)).toBe(false);
  });

  it('should reject numbers already present in the same 3x3 box', () => {
    const board = Array.from({ length: 9 }, () => Array(9).fill(0));
    board[1][1] = 4;
    expect(isValidMove(board, 0, 0, 4)).toBe(false);
    expect(isValidMove(board, 2, 2, 4)).toBe(false);
    expect(isValidMove(board, 0, 3, 4)).toBe(true);
    expect(isValidMove(board, 3, 0, 4)).toBe(true);
  });
});

describe('Sudoku Logic - solveSudoku pre-validation', () => {
  it('should return 0 solutions for unsolvable boards with row conflicts (fast failure)', () => {
    const grid: (number | null)[][] = Array.from({ length: 9 }, () => Array(9).fill(null));
    grid[0][0] = 1;
    grid[0][1] = 1; // Conflict in same row
    const { solutions } = solveSudoku(grid);
    expect(solutions).toBe(0);
  });

  it('should return 0 solutions for unsolvable boards with col conflicts (fast failure)', () => {
    const grid: (number | null)[][] = Array.from({ length: 9 }, () => Array(9).fill(null));
    grid[0][0] = 2;
    grid[1][0] = 2; // Conflict in same col
    const { solutions } = solveSudoku(grid);
    expect(solutions).toBe(0);
  });

  it('should return 0 solutions for unsolvable boards with box conflicts (fast failure)', () => {
    const grid: (number | null)[][] = Array.from({ length: 9 }, () => Array(9).fill(null));
    grid[0][0] = 3;
    grid[1][1] = 3; // Conflict in same 3x3 box
    const { solutions } = solveSudoku(grid);
    expect(solutions).toBe(0);
  });

  it('should return 0 solutions for boards with invalid structures or numbers', () => {
    // Missing a row
    const missingRowGrid = Array.from({ length: 8 }, () => Array(9).fill(null));
    expect(solveSudoku(missingRowGrid as any).solutions).toBe(0);

    // Invalid number
    const invalidNumGrid = Array.from({ length: 9 }, () => Array(9).fill(null));
    invalidNumGrid[0][0] = 10;
    expect(solveSudoku(invalidNumGrid).solutions).toBe(0);
  });
});


describe('Sudoku Logic - solveSudoku', () => {
  it('should successfully solve a valid incomplete board', () => {
    const grid: (number | null)[][] = [
      [5, 3, null, null, 7, null, null, null, null],
      [6, null, null, 1, 9, 5, null, null, null],
      [null, 9, 8, null, null, null, null, 6, null],
      [8, null, null, null, 6, null, null, null, 3],
      [4, null, null, 8, null, 3, null, null, 1],
      [7, null, null, null, 2, null, null, null, 6],
      [null, 6, null, null, null, null, 2, 8, null],
      [null, null, null, 4, 1, 9, null, null, 5],
      [null, null, null, null, 8, null, null, 7, 9]
    ];
    
    const { solutions, grid: solved } = solveSudoku(grid);
    expect(solutions).toBeGreaterThanOrEqual(1);
    expect(solved[0][0]).toBeGreaterThan(0);
  });

});

