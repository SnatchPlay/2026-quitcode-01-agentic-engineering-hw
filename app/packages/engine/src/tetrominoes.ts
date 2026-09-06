import type { RotationState, TetrominoType, Vec2 } from './types';

/**
 * Cell offsets for each tetromino x rotation state, using the Super Rotation
 * System (SRS) bounding boxes: 3x3 for JLSTZT, 4x4 for I, fixed 2x2-in-4x4 for O.
 * Coordinates are (col, row) with row increasing *downward* (row 0 = top of the
 * bounding box), matching the board's own (x, y) convention.
 */
const SHAPES: Record<TetrominoType, Record<RotationState, Vec2[]>> = {
  J: {
    SPAWN: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    CW: [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
    FLIP: [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }],
    CCW: [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
  },
  L: {
    SPAWN: [{ x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    CW: [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }],
    FLIP: [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 0, y: 2 }],
    CCW: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
  },
  S: {
    SPAWN: [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    CW: [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }],
    FLIP: [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
    CCW: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
  },
  Z: {
    SPAWN: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    CW: [{ x: 2, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }],
    FLIP: [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }],
    CCW: [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 0, y: 2 }],
  },
  T: {
    SPAWN: [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    CW: [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }],
    FLIP: [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }],
    CCW: [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
  },
  I: {
    SPAWN: [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }],
    CW: [{ x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }],
    FLIP: [{ x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }],
    CCW: [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 3 }],
  },
  O: {
    // O never (visually) rotates; all four states share one cell layout,
    // anchored inside a 4-wide box so its spawn x lines up with the others.
    SPAWN: [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    CW: [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    FLIP: [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    CCW: [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
  },
};

export function getCells(type: TetrominoType, rotation: RotationState): Vec2[] {
  return SHAPES[type][rotation];
}

/** Spawn column so every piece's 3-or-4-wide bounding box is centered on the 10-wide board. */
export function spawnPosition(type: TetrominoType, topRow: number): Vec2 {
  return { x: type === 'O' || type === 'I' ? 3 : 3, y: topRow };
}

const CW_NEXT: Record<RotationState, RotationState> = {
  SPAWN: 'CW',
  CW: 'FLIP',
  FLIP: 'CCW',
  CCW: 'SPAWN',
};
const CCW_NEXT: Record<RotationState, RotationState> = {
  SPAWN: 'CCW',
  CCW: 'FLIP',
  FLIP: 'CW',
  CW: 'SPAWN',
};

export function rotateCw(state: RotationState): RotationState {
  return CW_NEXT[state];
}
export function rotateCcw(state: RotationState): RotationState {
  return CCW_NEXT[state];
}

/**
 * SRS wall-kick offset tables, keyed by `"<from>>><to>"`. Test 0 (no offset,
 * i.e. the plain rotation) is *not* included here — callers try `(0,0)` first,
 * then these offsets in order, and the offset's own index (1-based) is what
 * distinguishes a T-spin "mini" from a "full" T-spin (index 4, the last/most
 * aggressive kick, always promotes to a full T-spin regardless of the 3-corner test).
 *
 * Board convention: +x right, +y down. These are derived from the published
 * SRS table (which uses +y up) by negating every y component.
 */
const JLSTZ_KICKS: Record<string, Vec2[]> = {
  'SPAWN>>CW': [{ x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: 2 }, { x: -1, y: 2 }],
  'CW>>SPAWN': [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: -2 }, { x: 1, y: -2 }],
  'CW>>FLIP': [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: -2 }, { x: 1, y: -2 }],
  'FLIP>>CW': [{ x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: 2 }, { x: -1, y: 2 }],
  'FLIP>>CCW': [{ x: 1, y: 0 }, { x: 1, y: -1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
  'CCW>>FLIP': [{ x: -1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: -2 }, { x: -1, y: -2 }],
  'CCW>>SPAWN': [{ x: -1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: -2 }, { x: -1, y: -2 }],
  'SPAWN>>CCW': [{ x: 1, y: 0 }, { x: 1, y: -1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
};

const I_KICKS: Record<string, Vec2[]> = {
  'SPAWN>>CW': [{ x: -2, y: 0 }, { x: 1, y: 0 }, { x: -2, y: 1 }, { x: 1, y: -2 }],
  'CW>>SPAWN': [{ x: 2, y: 0 }, { x: -1, y: 0 }, { x: 2, y: -1 }, { x: -1, y: 2 }],
  'CW>>FLIP': [{ x: -1, y: 0 }, { x: 2, y: 0 }, { x: -1, y: -2 }, { x: 2, y: 1 }],
  'FLIP>>CW': [{ x: 1, y: 0 }, { x: -2, y: 0 }, { x: 1, y: 2 }, { x: -2, y: -1 }],
  'FLIP>>CCW': [{ x: 2, y: 0 }, { x: -1, y: 0 }, { x: 2, y: -1 }, { x: -1, y: 2 }],
  'CCW>>FLIP': [{ x: -2, y: 0 }, { x: 1, y: 0 }, { x: -2, y: 1 }, { x: 1, y: -2 }],
  'CCW>>SPAWN': [{ x: 1, y: 0 }, { x: -2, y: 0 }, { x: 1, y: 2 }, { x: -2, y: -1 }],
  'SPAWN>>CCW': [{ x: -1, y: 0 }, { x: 2, y: 0 }, { x: -1, y: -2 }, { x: 2, y: 1 }],
};

/** Returns the ordered list of offsets to try for a rotation, offset 0 (no kick) included. */
export function getKickTable(type: TetrominoType, from: RotationState, to: RotationState): Vec2[] {
  if (type === 'O') return [{ x: 0, y: 0 }];
  const table = type === 'I' ? I_KICKS : JLSTZ_KICKS;
  const kicks = table[`${from}>>${to}`] ?? [];
  return [{ x: 0, y: 0 }, ...kicks];
}
