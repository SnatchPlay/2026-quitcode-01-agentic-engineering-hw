import type { BagState, TetrominoType } from './types.js';

const ALL_PIECES: readonly TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

/**
 * mulberry32 — a small, fast, seeded PRNG with good statistical quality for a
 * single 32-bit generator. Chosen because it's ~5 lines, has no dependencies,
 * and produces identical sequences across browser and Node given the same
 * uint32 state — exactly the determinism property replay verification needs.
 *
 * Pure step function: given the current state, returns the next float in
 * [0, 1) *and* the next state. We thread the state explicitly (rather than
 * closing over mutable variables) so `GameState`/`BagState` stay plain,
 * JSON-serializable objects with no hidden closure state.
 */
function nextFloat(state: number): { value: number; nextState: number } {
  let a = (state + 0x6d2b79f5) | 0;
  let t = a;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, nextState: a >>> 0 };
}

/** Fisher-Yates shuffle, threading the RNG state through explicitly. */
function shuffle<T>(items: readonly T[], rngState: number): { result: T[]; nextState: number } {
  const result = [...items];
  let state = rngState;
  for (let i = result.length - 1; i > 0; i--) {
    const { value, nextState } = nextFloat(state);
    state = nextState;
    const j = Math.floor(value * (i + 1));
    const tmp = result[i]!;
    result[i] = result[j]!;
    result[j] = tmp;
  }
  return { result, nextState: state };
}

const MIN_QUEUE_SIZE = 8;

export function createBagState(seed: number): BagState {
  return refillIfNeeded({ seed, rngState: seed >>> 0, queue: [] }, MIN_QUEUE_SIZE);
}

function refillIfNeeded(bag: BagState, minSize: number): BagState {
  let rngState = bag.rngState;
  const queue = [...bag.queue];
  while (queue.length < minSize) {
    const { result, nextState } = shuffle(ALL_PIECES, rngState);
    rngState = nextState;
    queue.push(...result);
  }
  return { seed: bag.seed, rngState, queue };
}

/** Pops the next piece off the bag, refilling with a fresh shuffled 7-bag as needed. */
export function drawNext(bag: BagState): { piece: TetrominoType; bag: BagState } {
  const filled = refillIfNeeded(bag, MIN_QUEUE_SIZE);
  const [piece, ...rest] = filled.queue;
  return { piece: piece!, bag: { ...filled, queue: rest } };
}

/** Peeks the next `count` pieces without consuming them (for the "next" preview UI). */
export function peekNext(bag: BagState, count: number): TetrominoType[] {
  const filled = refillIfNeeded(bag, count + 1);
  return filled.queue.slice(0, count);
}
