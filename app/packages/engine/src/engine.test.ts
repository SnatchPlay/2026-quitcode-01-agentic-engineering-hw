import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createEmptyBoard, dropDistance, isValidPlacement } from './board';
import { createGame, step } from './engine';
import { DIFFICULTY_PRESETS } from './presets';
import { replay } from './replay';
import type { Board, GameConfig, GameState, TimedAction } from './types';
import { BOARD_TOTAL_HEIGHT, BOARD_WIDTH } from './types';

function config(overrides: Partial<GameConfig> = {}): GameConfig {
  return {
    mode: 'marathon',
    preset: DIFFICULTY_PRESETS.classic,
    seed: 42,
    lineTarget: 0,
    timeLimitMs: 0,
    ...overrides,
  };
}

describe('createGame', () => {
  it('produces a valid, playable initial state', () => {
    const state = createGame(config());
    expect(state.phase).toBe('playing');
    expect(state.active).not.toBeNull();
    expect(isValidPlacement(state.board, state.active!)).toBe(true);
    expect(state.nextQueue).toHaveLength(state.config.preset.nextQueueSize);
    expect(state.score).toBe(0);
    expect(state.lines).toBe(0);
    expect(state.level).toBe(state.config.preset.startLevel);
  });

  it('is deterministic: the same seed produces the same first piece and queue', () => {
    const a = createGame(config({ seed: 7 }));
    const b = createGame(config({ seed: 7 }));
    expect(a.active!.type).toBe(b.active!.type);
    expect(a.nextQueue).toEqual(b.nextQueue);
  });
});

describe('movement', () => {
  it('move-left/move-right shift the active piece and stop at the walls', () => {
    let state = createGame(config());
    for (let i = 0; i < 20; i++) {
      state = step(state, [{ type: 'move-left' }]);
    }
    expect(isValidPlacement(state.board, state.active!)).toBe(true);
    const leftmostX = state.active!.position.x;

    for (let i = 0; i < 20; i++) {
      state = step(state, [{ type: 'move-right' }]);
    }
    expect(isValidPlacement(state.board, state.active!)).toBe(true);
    expect(state.active!.position.x).toBeGreaterThan(leftmostX);
  });

  it('rotate-cw four times returns the piece to its original rotation and position', () => {
    let state = createGame(config({ seed: 99 }));
    const original = { ...state.active! };
    for (let i = 0; i < 4; i++) {
      state = step(state, [{ type: 'rotate-cw' }]);
    }
    expect(state.active).toEqual(original);
  });
});

describe('hard drop and line clears', () => {
  it('locks the piece immediately, awards hard-drop points, and clears a completed row', () => {
    let board: Board = createEmptyBoard();
    const clearRow = 39;
    board = board.map((row, y) =>
      y === clearRow ? row.map((_, x) => (x === 3 || x === 4 ? null : 'I')) : row,
    ) as Board;
    // A stray block far from the target row so the board isn't a Perfect Clear (keeps the score simple).
    board[20]![0] = 'O';

    let state = createGame(config());
    state = { ...state, board, active: { type: 'O', rotation: 'SPAWN', position: { x: 2, y: 0 } } };
    // O's cells at position (2,0) are (3,0)/(4,0)/(3,1)/(4,1) -> lands with its bottom row filling
    // columns 3 and 4 of row 39, exactly plugging the two-cell gap.
    const distance = dropDistance(state.board, state.active!);

    const after = step(state, [{ type: 'hard-drop' }]);

    expect(after.lines).toBe(1);
    expect(after.events).toHaveLength(1);
    expect(after.events[0]!.kind).toBe('single');
    expect(after.score).toBe(100 + distance * 2); // base single (level 1, no combo/B2B) + hard-drop score
    // The O piece is 2 rows tall: only its bottom half plugged the gap in row 39 and
    // got cleared away. Its top half survives, shifted down into what is now row 39.
    expect(after.board[clearRow]).toEqual(
      Array.from({ length: BOARD_WIDTH }, (_, x) => (x === 3 || x === 4 ? 'O' : null)),
    );
    // The stray marker block shifts down by exactly one row with everything above the clear.
    expect(after.board[21]![0]).toBe('O');
  });

  it('detects a full T-spin (both front corners covered) and scores it as tspin-single', () => {
    let board: Board = createEmptyBoard();
    const targetRow = 36;
    board = board.map((row, y) => {
      if (y === targetRow) return row.map((_, x) => ((x === 4 || x === 5) ? null : 'I'));
      if (y === 35) return row.map((_, x) => (x === 3 || x === 5 ? 'I' : null));
      if (y === 37) return row.map((_, x) => (x === 5 ? 'I' : null));
      if (y === 38) return row.map((_, x) => ((x >= 3 && x <= 6) ? 'I' : null));
      return row;
    }) as Board;

    let state = createGame(config());
    state = {
      ...state,
      board,
      combo: -1,
      backToBack: false,
      active: { type: 'T', rotation: 'CW', position: { x: 3, y: 35 } },
      lastActionWasRotation: true,
      lastRotationWasKick: false,
      lastKickIndex: -1,
    };
    expect(isValidPlacement(state.board, state.active!)).toBe(true);
    expect(dropDistance(state.board, state.active!)).toBe(0); // already resting on the floor we built

    const after = step(state, [{ type: 'hard-drop' }]);

    expect(after.lines).toBe(1);
    expect(after.events[0]!.kind).toBe('tspin-single');
    expect(after.score).toBe(800); // tspin-single base at level 1, no B2B/combo yet
  });

  it('ends the game (block-out) when the next spawn has nowhere to go', () => {
    let board: Board = createEmptyBoard();
    // Block both possible spawn rows across every column any tetromino could spawn into.
    for (const y of [17, 18]) {
      for (let x = 3; x <= 6; x++) board[y]![x] = 'I';
    }

    let state = createGame(config());
    state = { ...state, board, active: { type: 'O', rotation: 'SPAWN', position: { x: 7, y: 0 } } };

    const after = step(state, [{ type: 'hard-drop' }]);

    expect(after.phase).toBe('topped-out');
    expect(after.gameOverReason).toBe('block-out');
    expect(after.active).toBeNull();
  });
});

describe('replay determinism', () => {
  const seed = 2024;
  const cfg = config({ seed, mode: 'sprint', lineTarget: 40 });

  it('produces byte-identical results for the same seed + input log', () => {
    const inputLog: TimedAction[] = [
      { frame: 0, action: { type: 'hard-drop' } },
      { frame: 10, action: { type: 'move-left' } },
      { frame: 10, action: { type: 'hard-drop' } },
      { frame: 20, action: { type: 'rotate-cw' } },
      { frame: 20, action: { type: 'hard-drop' } },
    ];
    const a = replay(cfg, inputLog);
    const b = replay(cfg, inputLog);
    expect(a).toEqual(b);
  });

  it('is deterministic for arbitrary random-but-valid action sequences', () => {
    const actionArb = fc.constantFrom<TimedAction['action']['type']>(
      'move-left',
      'move-right',
      'rotate-cw',
      'rotate-ccw',
      'hard-drop',
      'hold',
    );
    fc.assert(
      fc.property(fc.array(actionArb, { minLength: 0, maxLength: 200 }), (types) => {
        const inputLog: TimedAction[] = types.map((type, i) => ({ frame: i, action: { type } }));
        const a = replay(cfg, inputLog);
        const b = replay(cfg, inputLog);
        expect(a).toEqual(b);
      }),
      { numRuns: 25 },
    );
  });

  it('never lets the board grow wider than BOARD_WIDTH or the active piece leave the board', () => {
    let state: GameState = createGame(config({ seed: 5 }));
    const moves: Array<TimedAction['action']['type']> = ['move-left', 'move-right', 'rotate-cw', 'rotate-ccw'];
    for (let frame = 0; frame < 300 && state.phase === 'playing'; frame++) {
      const type = moves[frame % moves.length]!;
      state = step(state, [{ type }]);
      expect(state.board).toHaveLength(BOARD_TOTAL_HEIGHT);
      expect(state.board[0]).toHaveLength(BOARD_WIDTH);
      if (state.active) {
        expect(isValidPlacement(state.board, state.active)).toBe(true);
      }
    }
  });
});
