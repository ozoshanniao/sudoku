import { Cell, Difficulty } from '../types';

/**
 * 校验在 board[row][col] 填入数字 val 是否符合数独规则。
 */
export function isValidMove(board: number[][], row: number, col: number, val: number): boolean {
  // 检查行
  for (let c = 0; c < 9; c++) {
    if (c !== col && board[row][c] === val) return false;
  }
  // 检查列
  for (let r = 0; r < 9; r++) {
    if (r !== row && board[r][col] === val) return false;
  }
  // 检查 3x3 宫
  const boxRowStart = Math.floor(row / 3) * 3;
  const boxColStart = Math.floor(col / 3) * 3;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const currRow = boxRowStart + r;
      const currCol = boxColStart + c;
      if ((currRow !== row || currCol !== col) && board[currRow][currCol] === val) {
        return false;
      }
    }
  }
  return true;
}

/**
 * 使用 Web Worker 异步生成具有唯一解的数独谜题，避免阻塞主线程。
 */
export function generateSudokuAsync(difficulty: Difficulty, seed?: number): Promise<Cell[][]> {
  return new Promise((resolve, reject) => {
    try {
      const worker = new Worker(
        new URL('./sudoku.worker.ts', import.meta.url),
        { type: 'module' }
      );
      worker.onmessage = (event: MessageEvent) => {
        resolve(event.data);
        worker.terminate();
      };
      worker.onerror = (error) => {
        reject(error);
        worker.terminate();
      };
      worker.postMessage({ difficulty, seed });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * 验证整个数独盘面的初始状态是否合法（无冲突，9x9，数字1-9）。
 */
export function isValidBoard(grid: (number | null)[][]): boolean {
  if (!Array.isArray(grid) || grid.length !== 9) return false;
  
  const rows = Array.from({ length: 9 }, () => new Set<number>());
  const cols = Array.from({ length: 9 }, () => new Set<number>());
  const boxes = Array.from({ length: 9 }, () => new Set<number>());

  for (let r = 0; r < 9; r++) {
    if (!Array.isArray(grid[r]) || grid[r].length !== 9) return false;
    
    for (let c = 0; c < 9; c++) {
      const val = grid[r][c];
      if (val === null || val === 0) continue;
      if (typeof val !== 'number' || val < 1 || val > 9 || !Number.isInteger(val)) return false;

      const boxIdx = Math.floor(r / 3) * 3 + Math.floor(c / 3);

      if (rows[r].has(val) || cols[c].has(val) || boxes[boxIdx].has(val)) {
        return false;
      }
      rows[r].add(val);
      cols[c].add(val);
      boxes[boxIdx].add(val);
    }
  }
  return true;
}

/**
 * 简单的回溯求解器，用于统计谜题的解数量（最多到 2，用于唯一解校验）。
 */
export function solveSudoku(grid: (number | null)[][]): { solutions: number; grid: number[][] } {
  let solutionsCount = 0;
  let solvedGrid: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));

  if (!isValidBoard(grid)) {
    return { solutions: 0, grid: solvedGrid };
  }

  const puzzleArr: number[][] = grid.map(row => row.map(cell => cell || 0));

  function solve(row: number = 0, col: number = 0): boolean {
    if (row === 9) {
      solutionsCount++;
      solvedGrid = puzzleArr.map(r => [...r]);
      return solutionsCount >= 2; // 找到2个解就可以停止了
    }

    const nextCol = (col + 1) % 9;
    const nextRow = nextCol === 0 ? row + 1 : row;

    if (puzzleArr[row][col] !== 0) {
      return solve(nextRow, nextCol);
    }

    for (let val = 1; val <= 9; val++) {
      if (isValidMove(puzzleArr, row, col, val)) {
        puzzleArr[row][col] = val;
        if (solve(nextRow, nextCol)) {
          return true; // 如果已经有多解，提前结束
        }
        puzzleArr[row][col] = 0;
      }
    }
    return false;
  }

  solve();
  return { solutions: solutionsCount, grid: solvedGrid };
}

