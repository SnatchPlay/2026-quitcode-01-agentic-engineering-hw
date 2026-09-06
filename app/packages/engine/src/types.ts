/**
 * Core types for the deterministic Tetris engine.
 *
 * The engine is intentionally framework-agnostic and dependency-free: it must run
 * identically in a browser tab and inside a Node.js worker on the server, because
 * server-side replay verification depends on bit-for-bit reproducible results.
 */

export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

/** Rotation states, clockwise: SPAWN -> CW -> FLIP -> CCW -> SPAWN. */
export type RotationState = 'SPAWN' | 'CW' | 'FLIP' | 'CCW';

export interface Vec2 {
  x: number;
  y: number;
}

/** A single falling/held piece: type + rotation state + top-left bounding-box position. */
export interface ActivePiece {
  type: TetrominoType;
  rotation: RotationState;
  /** Top-left corner of the piece's bounding box, in board cell coordinates. */
  position: Vec2;
}

/** `null` = empty cell, otherwise the tetromino type that occupies it (for coloring). */
export type BoardCell = TetrominoType | null;

/** Row-major grid, `rows[y][x]`. Includes the hidden buffer zone above the visible field. */
export type Board = BoardCell[][];

export type GamePhase = 'ready' | 'playing' | 'paused' | 'topped-out' | 'finished';

/** Discrete player intents. Continuous key-hold repetition (DAS/ARR) is resolved
 * by the input layer *before* actions reach the engine — the engine only ever
 * sees discrete, timestamped actions, which is what makes replays deterministic. */
export type ActionType =
  | 'move-left'
  | 'move-right'
  | 'soft-drop-start'
  | 'soft-drop-end'
  | 'hard-drop'
  | 'rotate-cw'
  | 'rotate-ccw'
  | 'rotate-180'
  | 'hold';

export interface GameAction {
  type: ActionType;
}

/** One entry of a recorded input log: the exact simulation frame an action was applied on. */
export interface TimedAction {
  frame: number;
  action: GameAction;
}

export type ClearKind =
  | 'single'
  | 'double'
  | 'triple'
  | 'tetris'
  | 'tspin-mini'
  | 'tspin-single'
  | 'tspin-double'
  | 'tspin-triple';

export interface LineClearEvent {
  frame: number;
  kind: ClearKind;
  rows: number[];
  combo: number;
  backToBack: boolean;
  perfectClear: boolean;
  scoreDelta: number;
}

export type GameMode = 'marathon' | 'sprint' | 'ultra' | 'zen';

export type DifficultyPresetName = 'chill' | 'classic' | 'expert' | 'insane' | 'custom';

export interface DifficultyPreset {
  name: DifficultyPresetName;
  startLevel: number;
  gravityMultiplier: number;
  lockDelayMs: number;
  lockDelayMaxResets: number;
  nextQueueSize: 1 | 2 | 3 | 4 | 5;
  ghostPieceEnabled: boolean;
  holdEnabled: boolean;
}

export interface GameConfig {
  mode: GameMode;
  preset: DifficultyPreset;
  seed: number;
  /** Marathon: line target (0 = endless). Sprint: exact line target (usually 40). */
  lineTarget: number;
  /** Ultra: time limit in ms (0 = unlimited). */
  timeLimitMs: number;
}

export interface GameState {
  config: GameConfig;
  board: Board;
  active: ActivePiece | null;
  holdPiece: TetrominoType | null;
  holdUsedThisPiece: boolean;
  nextQueue: TetrominoType[];
  bagState: BagState;
  phase: GamePhase;
  frame: number;
  score: number;
  lines: number;
  level: number;
  combo: number;
  backToBack: boolean;
  softDropHeld: boolean;
  /** Sub-cell gravity accumulator, in rows. */
  gravityAccumulator: number;
  /** ms remaining until the active piece locks while resting on the stack; null = not resting. */
  lockDelayRemainingMs: number | null;
  lockDelayResetsUsed: number;
  /** Rotation kick index used for the *last* successful rotation (for T-spin mini/full detection). */
  lastRotationWasKick: boolean;
  lastKickIndex: number;
  lastActionWasRotation: boolean;
  gameOverReason: 'block-out' | 'lock-out' | 'top-out' | null;
  events: LineClearEvent[];
}

export interface BagState {
  seed: number;
  /** Internal mulberry32 RNG cursor, advanced every time the bag is refilled. */
  rngState: number;
  queue: TetrominoType[];
}

export interface RunResult {
  score: number;
  lines: number;
  level: number;
  frames: number;
  durationMs: number;
  topOut: boolean;
  finishedByLineTarget: boolean;
  finishedByTimeLimit: boolean;
}

export const ENGINE_VERSION = '1.0.0';

export const BOARD_WIDTH = 10;
export const BOARD_VISIBLE_HEIGHT = 20;
export const BOARD_BUFFER_HEIGHT = 20;
export const BOARD_TOTAL_HEIGHT = BOARD_VISIBLE_HEIGHT + BOARD_BUFFER_HEIGHT;

/** Fixed simulation step, matching the guideline's 60 fps reference implementation. */
export const FRAME_MS = 1000 / 60;
