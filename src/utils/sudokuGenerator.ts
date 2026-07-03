import { Cell, Difficulty } from '../types';
import { isValidMove, solveSudoku } from './sudoku';

// Helper: Fill grid randomly
export function fillGrid(grid: number[][], rng: () => number = Math.random): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => rng() - 0.5);
        for (const num of numbers) {
          if (isValidMove(grid, row, col, num)) {
            grid[row][col] = num;
            if (fillGrid(grid, rng)) {
              return true;
            }
            grid[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

// Logic Rater: Rates the puzzle's difficulty based on logical steps required to solve it
export function ratePuzzleDifficulty(initialGrid: (number | null)[][]): number {
  let grid: number[][] = initialGrid.map(row => row.map(cell => cell || 0));
  let score = 0;
  let changed = true;

  // Track cell candidates
  const getCandidates = (g: number[][], r: number, c: number): number[] => {
    if (g[r][c] !== 0) return [];
    const list: number[] = [];
    for (let val = 1; val <= 9; val++) {
      if (isValidMove(g, r, c, val)) {
        list.push(val);
      }
    }
    return list;
  };

  while (changed) {
    changed = false;

    // 1. Naked Singles (Candidate count === 1)
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] === 0) {
          const candidates = getCandidates(grid, r, c);
          if (candidates.length === 1) {
            grid[r][c] = candidates[0];
            score += 1; // 1 point for naked single
            changed = true;
            break;
          }
        }
      }
      if (changed) break;
    }
    if (changed) continue;

    // 2. Hidden Singles (Only one place in row/col/box where a number can go)
    // Check rows
    for (let r = 0; r < 9; r++) {
      for (let val = 1; val <= 9; val++) {
        let possibleCols: number[] = [];
        for (let c = 0; c < 9; c++) {
          if (grid[r][c] === 0 && getCandidates(grid, r, c).includes(val)) {
            possibleCols.push(c);
          }
        }
        if (possibleCols.length === 1) {
          grid[r][possibleCols[0]] = val;
          score += 2; // 2 points for hidden single in row
          changed = true;
          break;
        }
      }
      if (changed) break;
    }
    if (changed) continue;

    // Check columns
    for (let c = 0; c < 9; c++) {
      for (let val = 1; val <= 9; val++) {
        let possibleRows: number[] = [];
        for (let r = 0; r < 9; r++) {
          if (grid[r][c] === 0 && getCandidates(grid, r, c).includes(val)) {
            possibleRows.push(r);
          }
        }
        if (possibleRows.length === 1) {
          grid[possibleRows[0]][c] = val;
          score += 2; // 2 points for hidden single in col
          changed = true;
          break;
        }
      }
      if (changed) break;
    }
    if (changed) continue;

    // Check 3x3 boxes
    for (let boxRow = 0; boxRow < 9; boxRow += 3) {
      for (let boxCol = 0; boxCol < 9; boxCol += 3) {
        for (let val = 1; val <= 9; val++) {
          let matches: [number, number][] = [];
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              const currR = boxRow + r;
              const currC = boxCol + c;
              if (grid[currR][currC] === 0 && getCandidates(grid, currR, currC).includes(val)) {
                matches.push([currR, currC]);
              }
            }
          }
          if (matches.length === 1) {
            grid[matches[0][0]][matches[0][1]] = val;
            score += 3; // 3 points for hidden single in 3x3 box
            changed = true;
            break;
          }
        }
        if (changed) break;
      }
      if (changed) break;
    }
    if (changed) continue;

    // 3. Pointing/Claiming (Locked Candidates)
    // If all candidates for a number in a box are in the same row/col, exclude from other boxes in that row/col
    for (let boxRow = 0; boxRow < 9; boxRow += 3) {
      for (let boxCol = 0; boxCol < 9; boxCol += 3) {
        for (let val = 1; val <= 9; val++) {
          let cells: [number, number][] = [];
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              const currR = boxRow + r;
              const currC = boxCol + c;
              if (grid[currR][currC] === 0 && getCandidates(grid, currR, currC).includes(val)) {
                cells.push([currR, currC]);
              }
            }
          }

          if (cells.length > 1 && cells.length <= 3) {
            const firstRow = cells[0][0];
            const firstCol = cells[0][1];
            const sameRow = cells.every(cell => cell[0] === firstRow);
            const sameCol = cells.every(cell => cell[1] === firstCol);

            if (sameRow) {
              // Exclude val from this row in other boxes
              for (let c = 0; c < 9; c++) {
                if (Math.floor(c / 3) * 3 !== boxCol && grid[firstRow][c] === 0 && getCandidates(grid, firstRow, c).includes(val)) {
                  score += 4;
                }
              }
            } else if (sameCol) {
              // Exclude val from this col in other boxes
              for (let r = 0; r < 9; r++) {
                if (Math.floor(r / 3) * 3 !== boxRow && grid[r][firstCol] === 0 && getCandidates(grid, r, firstCol).includes(val)) {
                  score += 4;
                }
              }
            }
          }
        }
      }
    }
    if (changed) continue;
  }

  // Check if grid is solved
  const isSolved = grid.every(row => row.every(cell => cell !== 0));
  if (!isSolved) {
    const emptyCount = grid.reduce((acc, row) => acc + row.filter(c => c === 0).length, 0);
    score += emptyCount * 6; // Expert level backtrack cost
  }

  return score;
}

// Generate unique sudoku using Digging Holes
export function generateUniqueSudoku(difficulty: Difficulty, rng: () => number = Math.random): { board: Cell[][]; score: number } {
  let solvedGrid: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));
  
  // Fill diagonal boxes first to randomize
  for (let box = 0; box < 9; box += 3) {
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => rng() - 0.5);
    let idx = 0;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        solvedGrid[box + r][box + c] = nums[idx++];
      }
    }
  }
  fillGrid(solvedGrid, rng);

  // Convert to cells format
  const cells: Cell[][] = Array.from({ length: 9 }, (_, r) =>
    Array.from({ length: 9 }, (_, c) => ({
      row: r,
      col: c,
      value: solvedGrid[r][c],
      solvedValue: solvedGrid[r][c],
      isClue: true,
      notes: [],
      isInvalid: false,
    }))
  );

  // Determine target number of holes to dig
  let targetHoles = 40; // Easy
  if (difficulty === 'medium') targetHoles = 46;
  else if (difficulty === 'hard') targetHoles = 53;
  else if (difficulty === 'expert') targetHoles = 58;

  const cellsList: [number, number][] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      cellsList.push([r, c]);
    }
  }
  cellsList.sort(() => rng() - 0.5);

  let holesDug = 0;
  for (const [r, c] of cellsList) {
    if (holesDug >= targetHoles) break;

    const backup = cells[r][c].value;
    cells[r][c].value = null;
    cells[r][c].isClue = false;

    // Verify uniqueness
    const tempGrid = cells.map(row => row.map(cell => cell.value));
    const { solutions } = solveSudoku(tempGrid);

    if (solutions === 1) {
      holesDug++;
    } else {
      // Restore
      cells[r][c].value = backup;
      cells[r][c].isClue = true;
    }
  }

  // Calculate difficulty score
  const simpleGrid = cells.map(row => row.map(cell => cell.value));
  const score = ratePuzzleDifficulty(simpleGrid);

  return { board: cells, score };
}

// Main generation entry point handling retries for difficulty constraints
export function generateSudokuBoard(difficulty: Difficulty, rng: () => number = Math.random): Cell[][] {
  // Define score boundaries for each difficulty
  let minScore = 0;
  let maxScore = 40;
  if (difficulty === 'medium') {
    minScore = 41;
    maxScore = 90;
  } else if (difficulty === 'hard') {
    minScore = 91;
    maxScore = 150;
  } else if (difficulty === 'expert') {
    minScore = 151;
    maxScore = 9999;
  }

  let attempt = 0;
  let result = generateUniqueSudoku(difficulty, rng);

  // Keep generating until it meets the strict score range
  while (attempt < 15 && (result.score < minScore || result.score > maxScore)) {
    result = generateUniqueSudoku(difficulty, rng);
    attempt++;
  }

  return result.board;
}
