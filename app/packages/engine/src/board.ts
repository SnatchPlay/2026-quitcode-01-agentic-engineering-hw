import { getCells } from './tetrominoes.js';
import type { ActivePiece, Board, BoardCell, Vec2 } from './types.js';
import { BOARD_TOTAL_HEIGHT, BOARD_WIDTH } from './types.js';

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_TOTAL_HEIGHT }, () =>
    Array.from({ length: BOARD_WIDTH }, (): BoardCell => null),
  );
}

/** Absolute board-space cells a piece currently occupies. */
export function pieceCells(piece: ActivePiece): Vec2[] {
  return getCells(piece.type, piece.rotation).map((c) => ({
    x: c.x + piece.position.x,
    y: c.y + piece.position.y,
  }));
}

export function isInsideBounds(cell: Vec2): boolean {
  return cell.x >= 0 && cell.x < BOARD_WIDTH && cell.y >= 0 && cell.y < BOARD_TOTAL_HEIGHT;
}

export function isCellFree(board: Board, cell: Vec2): boolean {
  if (!isInsideBounds(cell)) return false;
  return board[cell.y]![cell.x] === null;
}

/** A piece is in a legal position iff every one of its cells is in-bounds and empty. */
export function isValidPlacement(board: Board, piece: ActivePiece): boolean {
  return pieceCells(piece).every((cell) => isCellFree(board, cell));
}

/** Whether the piece would collide if moved one row down (i.e. it's resting on something). */
export function isGrounded(board: Board, piece: ActivePiece): boolean {
  const below: ActivePiece = { ...piece, position: { x: piece.position.x, y: piece.position.y + 1 } };
  return !isValidPlacement(board, below);
}

/** Stamps a piece's cells permanently onto the board (post-lock). Returns a new board. */
export function mergePiece(board: Board, piece: ActivePiece): Board {
  const next = board.map((row) => [...row]);
  for (const cell of pieceCells(piece)) {
    if (isInsideBounds(cell)) next[cell.y]![cell.x] = piece.type;
  }
  return next;
}

/** Row indices (top to bottom) that are fully occupied. */
export function findFullRows(board: Board): number[] {
  const full: number[] = [];
  for (let y = 0; y < board.length; y++) {
    if (board[y]!.every((cell) => cell !== null)) full.push(y);
  }
  return full;
}

/** Removes the given rows and shifts everything above them down by one per removed row. */
export function clearRows(board: Board, rows: number[]): Board {
  if (rows.length === 0) return board;
  const rowSet = new Set(rows);
  const kept = board.filter((_, y) => !rowSet.has(y));
  const emptyRow = (): BoardCell[] => Array.from({ length: BOARD_WIDTH }, (): BoardCell => null);
  const filler = Array.from({ length: rows.length }, emptyRow);
  return [...filler, ...kept];
}

export function isBoardEmpty(board: Board): boolean {
  return board.every((row) => row.every((cell) => cell === null));
}

/** Hard-drop landing offset: how many rows the piece can fall before it would collide. */
export function dropDistance(board: Board, piece: ActivePiece): number {
  let distance = 0;
  while (
    isValidPlacement(board, { ...piece, position: { x: piece.position.x, y: piece.position.y + distance + 1 } })
  ) {
    distance++;
  }
  return distance;
}
