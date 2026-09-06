// NOTE: re-exported explicitly (not via `export * from './types'`) — Turbopack's
// workspace-package resolution didn't reliably flatten a wildcard re-export of a
// module that mixes `export const` and `export type`/`export interface` declarations.
export type {
  TetrominoType,
  RotationState,
  Vec2,
  ActivePiece,
  BoardCell,
  Board,
  GamePhase,
  ActionType,
  GameAction,
  TimedAction,
  ClearKind,
  LineClearEvent,
  GameMode,
  DifficultyPresetName,
  DifficultyPreset,
  GameConfig,
  GameState,
  BagState,
  RunResult,
} from './types';
export { ENGINE_VERSION, BOARD_WIDTH, BOARD_VISIBLE_HEIGHT, BOARD_BUFFER_HEIGHT, BOARD_TOTAL_HEIGHT, FRAME_MS } from './types';

export { createGame, step } from './engine';
export { replay } from './replay';
export { DIFFICULTY_PRESETS, customPreset } from './presets';
export { pieceCells, dropDistance, isValidPlacement, isGrounded, createEmptyBoard } from './board';
export { getCells, getKickTable } from './tetrominoes';
export { gravityRowsPerSecond } from './scoring';
export { peekNext } from './rng';
