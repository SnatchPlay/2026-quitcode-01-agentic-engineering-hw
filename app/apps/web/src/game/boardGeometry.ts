import { BOARD_BUFFER_HEIGHT, BOARD_VISIBLE_HEIGHT, BOARD_WIDTH, dropDistance, pieceCells } from '@tetris/engine';
import type { ActivePiece, Board, Vec2 } from '@tetris/engine';

export { BOARD_WIDTH, BOARD_VISIBLE_HEIGHT };

/** Converts a board-space (0..39) row into a visible-grid (0..19) row, or null if it's in the hidden buffer. */
export function toVisibleRow(boardY: number): number | null {
  const visible = boardY - BOARD_BUFFER_HEIGHT;
  return visible >= 0 && visible < BOARD_VISIBLE_HEIGHT ? visible : null;
}

export interface RenderCell {
  x: number;
  visibleY: number;
}

/** Cells of a piece, converted to visible-grid coordinates. Cells still in the buffer zone are
 * kept with a negative `visibleY` (rather than dropped) so a just-spawned piece can be seen
 * sliding smoothly into view instead of popping in at row 0. */
export function pieceToVisibleCells(piece: ActivePiece): RenderCell[] {
  return pieceCells(piece).map((c) => ({ x: c.x, visibleY: c.y - BOARD_BUFFER_HEIGHT }));
}

export function ghostCells(board: Board, piece: ActivePiece): RenderCell[] {
  const distance = dropDistance(board, piece);
  const dropped: ActivePiece = { ...piece, position: { x: piece.position.x, y: piece.position.y + distance } };
  return pieceToVisibleCells(dropped);
}

export function centerOfCells(cells: Vec2[]): Vec2 {
  const sum = cells.reduce((acc, c) => ({ x: acc.x + c.x, y: acc.y + c.y }), { x: 0, y: 0 });
  return { x: sum.x / cells.length, y: sum.y / cells.length };
}
