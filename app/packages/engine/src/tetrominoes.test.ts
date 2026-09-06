import { describe, expect, it } from 'vitest';
import { getCells, getKickTable, rotateCcw, rotateCw } from './tetrominoes.js';
import type { RotationState, TetrominoType } from './types.js';

const ALL_TYPES: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
const ALL_ROTATIONS: RotationState[] = ['SPAWN', 'CW', 'FLIP', 'CCW'];

describe('rotation state machine', () => {
  it('four clockwise rotations return to the starting state', () => {
    for (const start of ALL_ROTATIONS) {
      let state = start;
      for (let i = 0; i < 4; i++) state = rotateCw(state);
      expect(state).toBe(start);
    }
  });

  it('four counter-clockwise rotations return to the starting state', () => {
    for (const start of ALL_ROTATIONS) {
      let state = start;
      for (let i = 0; i < 4; i++) state = rotateCcw(state);
      expect(state).toBe(start);
    }
  });

  it('rotateCcw is the exact inverse of rotateCw', () => {
    for (const start of ALL_ROTATIONS) {
      expect(rotateCcw(rotateCw(start))).toBe(start);
    }
  });
});

describe('tetromino shapes', () => {
  it('every piece has exactly 4 cells in every rotation state', () => {
    for (const type of ALL_TYPES) {
      for (const rotation of ALL_ROTATIONS) {
        expect(getCells(type, rotation)).toHaveLength(4);
      }
    }
  });

  it('O piece occupies the same cells in every rotation state', () => {
    const spawn = getCells('O', 'SPAWN');
    for (const rotation of ALL_ROTATIONS) {
      expect(getCells('O', rotation)).toEqual(spawn);
    }
  });

  it('no two cells of the same piece/rotation overlap', () => {
    for (const type of ALL_TYPES) {
      for (const rotation of ALL_ROTATIONS) {
        const cells = getCells(type, rotation);
        const keys = new Set(cells.map((c) => `${c.x},${c.y}`));
        expect(keys.size).toBe(4);
      }
    }
  });
});

describe('SRS wall-kick tables', () => {
  it('always tries the "no kick" offset (0,0) first', () => {
    for (const type of ALL_TYPES) {
      for (const from of ALL_ROTATIONS) {
        const to = rotateCw(from);
        expect(getKickTable(type, from, to)[0]).toEqual({ x: 0, y: 0 });
      }
    }
  });

  it('O piece has only the trivial kick', () => {
    expect(getKickTable('O', 'SPAWN', 'CW')).toEqual([{ x: 0, y: 0 }]);
  });

  it('JLSTZ and I kick tables are exact negations of their reverse transition', () => {
    const pairs: [RotationState, RotationState][] = [
      ['SPAWN', 'CW'],
      ['CW', 'FLIP'],
      ['FLIP', 'CCW'],
      ['CCW', 'SPAWN'],
    ];
    for (const type of ['T', 'I'] as TetrominoType[]) {
      for (const [from, to] of pairs) {
        const forward = getKickTable(type, from, to);
        const backward = getKickTable(type, to, from);
        expect(forward).toHaveLength(backward.length);
        for (let i = 0; i < forward.length; i++) {
          // `-0` and `0` are distinct under `toEqual`'s deep equality, but equivalent here.
          expect(forward[i]).toEqual({ x: (-backward[i]!.x) || 0, y: (-backward[i]!.y) || 0 });
        }
      }
    }
  });
});
