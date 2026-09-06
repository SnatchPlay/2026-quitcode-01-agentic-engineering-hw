import type { ClearKind } from './types';

/** Base score per Tetris Guideline scoring table (before the level multiplier). */
const BASE_SCORE: Record<ClearKind, number> = {
  single: 100,
  double: 300,
  triple: 500,
  tetris: 800,
  'tspin-mini': 100,
  'tspin-single': 800,
  'tspin-double': 1200,
  'tspin-triple': 1600,
};

const BACK_TO_BACK_KINDS = new Set<ClearKind>(['tetris', 'tspin-mini', 'tspin-single', 'tspin-double', 'tspin-triple']);

export function qualifiesForBackToBack(kind: ClearKind): boolean {
  return BACK_TO_BACK_KINDS.has(kind);
}

export interface ScoreInput {
  kind: ClearKind;
  level: number;
  combo: number;
  backToBack: boolean;
  perfectClear: boolean;
  perfectClearWasTetris: boolean;
}

/**
 * Full line-clear score for one lock event, following the Tetris Guideline:
 * base(kind) * level, x1.5 back-to-back bonus (kept as an integer via floor),
 * plus combo bonus and Perfect Clear bonus (which stacks additively, not
 * multiplicatively, with the line-clear score it accompanies).
 */
export function scoreLineClear(input: ScoreInput): number {
  const { kind, level, combo, backToBack, perfectClear, perfectClearWasTetris } = input;
  let score = BASE_SCORE[kind] * level;
  if (backToBack && qualifiesForBackToBack(kind)) {
    score = Math.floor(score * 1.5);
  }
  if (combo > 0) {
    score += 50 * combo * level;
  }
  if (perfectClear) {
    score += perfectClearBonus(kind, perfectClearWasTetris) * level;
  }
  return score;
}

function perfectClearBonus(kind: ClearKind, wasAlreadyTetrisB2B: boolean): number {
  switch (kind) {
    case 'single':
      return 800;
    case 'double':
      return 1000;
    case 'triple':
      return 1800;
    case 'tetris':
      return wasAlreadyTetrisB2B ? 3200 : 2000;
    default:
      // A Perfect Clear via T-spin is rare but not impossible; treat like a triple-tier bonus.
      return 1800;
  }
}

export function softDropScore(cellsDropped: number): number {
  return cellsDropped * 1;
}

export function hardDropScore(cellsDropped: number): number {
  return cellsDropped * 2;
}

/** Level advances every 10 lines cleared (Guideline "line-based" progression). */
export function levelForLines(startLevel: number, totalLines: number): number {
  return startLevel + Math.floor(totalLines / 10);
}

/**
 * Gravity in rows/second, from the Tetris Worlds formula, scaled by the active
 * difficulty preset's multiplier. Capped so it never exceeds 20G (instant drop
 * territory) — beyond that, difficulty should come from lock delay, not speed.
 */
export function gravityRowsPerSecond(level: number, multiplier: number): number {
  const base = Math.pow(0.8 - (level - 1) * 0.007, level - 1);
  const rowsPerSecond = (1 / base) * multiplier;
  return Math.min(rowsPerSecond, 20 * 60); // 20G = 20 rows per frame at 60fps
}

export function clearKindFromLineCount(count: number, isTSpin: boolean, isMini: boolean): ClearKind {
  if (isTSpin) {
    if (isMini) return 'tspin-mini';
    if (count === 0) return 'tspin-mini';
    if (count === 1) return 'tspin-single';
    if (count === 2) return 'tspin-double';
    return 'tspin-triple';
  }
  if (count === 1) return 'single';
  if (count === 2) return 'double';
  if (count === 3) return 'triple';
  return 'tetris';
}
