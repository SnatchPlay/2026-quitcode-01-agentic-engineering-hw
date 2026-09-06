import { describe, expect, it } from 'vitest';
import {
  clearRows,
  createEmptyBoard,
  dropDistance,
  findFullRows,
  isBoardEmpty,
  isValidPlacement,
  mergePiece,
  pieceCells,
} from './board.js';
import { BOARD_TOTAL_HEIGHT, BOARD_WIDTH } from './types.js';
import type { ActivePiece } from './types.js';

const tPieceAt = (x: number, y: number): ActivePiece => ({ type: 'T', rotation: 'SPAWN', position: { x, y } });

describe('board', () => {
  it('starts empty', () => {
    const board = createEmptyBoard();
    expect(board).toHaveLength(BOARD_TOTAL_HEIGHT);
    expect(isBoardEmpty(board)).toBe(true);
    expect(board[0]).toHaveLength(BOARD_WIDTH);
  });

  it('rejects placements that go out of bounds', () => {
    const board = createEmptyBoard();
    expect(isValidPlacement(board, tPieceAt(-1, 5))).toBe(false);
    expect(isValidPlacement(board, tPieceAt(9, 5))).toBe(false); // T spans 3 cols, x=9 overflows
    expect(isValidPlacement(board, tPieceAt(3, BOARD_TOTAL_HEIGHT - 1))).toBe(false);
  });

  it('rejects placements that overlap locked cells', () => {
    let board = createEmptyBoard();
    board = mergePiece(board, tPieceAt(3, 5));
    expect(isValidPlacement(board, tPieceAt(3, 5))).toBe(false);
  });

  it('mergePiece stamps every cell of the piece with its type', () => {
    const board = mergePiece(createEmptyBoard(), tPieceAt(3, 5));
    const cells = pieceCells(tPieceAt(3, 5));
    for (const cell of cells) {
      expect(board[cell.y]![cell.x]).toBe('T');
    }
  });

  it('finds and clears exactly the full rows, shifting everything above down', () => {
    let board = createEmptyBoard();
    const row = 39;
    board = board.map((r, y) => (y === row ? Array(BOARD_WIDTH).fill('I') : r)) as typeof board;
    // Put a marker cell one row above so we can verify it shifts down after the clear.
    board[row - 1]![2] = 'O';

    expect(findFullRows(board)).toEqual([row]);
    const cleared = clearRows(board, [row]);
    expect(cleared[row]![2]).toBe('O');
    expect(cleared[row]!.filter((c) => c !== null)).toHaveLength(1);
    expect(isBoardEmpty(clearRows(createEmptyBoard(), []))).toBe(true);
  });

  it('dropDistance stops exactly on top of the stack', () => {
    let board = createEmptyBoard();
    const floorRow = BOARD_TOTAL_HEIGHT - 1;
    board[floorRow] = Array(BOARD_WIDTH).fill('I');
    const piece = tPieceAt(3, 5);
    const distance = dropDistance(board, piece);
    const landed = { ...piece, position: { x: piece.position.x, y: piece.position.y + distance } };
    expect(isValidPlacement(board, landed)).toBe(true);
    const oneMore = { ...landed, position: { x: landed.position.x, y: landed.position.y + 1 } };
    expect(isValidPlacement(board, oneMore)).toBe(false);
  });
});
