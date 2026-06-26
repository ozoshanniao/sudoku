import { Difficulty } from '../types';
import { generateSudokuBoard } from './sudokuGenerator';

// Worker message listener
self.onmessage = function (e: MessageEvent) {
  const { difficulty } = e.data as { difficulty: Difficulty };
  
  // Call the pure generator function
  const board = generateSudokuBoard(difficulty);

  // Send back generated puzzle board
  self.postMessage(board);
};
