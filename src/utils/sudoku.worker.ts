import { Difficulty } from '../types';
import { generateSudokuBoard } from './sudokuGenerator';
import { createSeededRng } from './dailyChallenge';

// Worker message listener
self.onmessage = function (e: MessageEvent) {
  const { difficulty, seed } = e.data as { difficulty: Difficulty; seed?: number };
  
  const rng = seed !== undefined ? createSeededRng(seed) : undefined;
  
  // Call the pure generator function
  const board = generateSudokuBoard(difficulty, rng);

  // Send back generated puzzle board
  self.postMessage(board);
};
