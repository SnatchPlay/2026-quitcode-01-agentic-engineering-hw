import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createBagState, drawNext, peekNext } from './rng';
import type { TetrominoType } from './types';

const ALL: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

describe('7-bag randomizer', () => {
  it('every consecutive group of 7 draws is a permutation of all 7 pieces', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2 ** 32 - 1 }), (seed) => {
        let bag = createBagState(seed);
        const drawn: TetrominoType[] = [];
        for (let i = 0; i < 70; i++) {
          const { piece, bag: next } = drawNext(bag);
          bag = next;
          drawn.push(piece);
        }
        for (let i = 0; i < 70; i += 7) {
          const group = drawn.slice(i, i + 7);
          expect([...group].sort()).toEqual([...ALL].sort());
        }
      }),
    );
  });

  it('is deterministic: same seed always produces the same sequence', () => {
    const seed = 123456789;
    const drawSequence = () => {
      let bag = createBagState(seed);
      const out: TetrominoType[] = [];
      for (let i = 0; i < 20; i++) {
        const { piece, bag: next } = drawNext(bag);
        bag = next;
        out.push(piece);
      }
      return out;
    };
    expect(drawSequence()).toEqual(drawSequence());
  });

  it('different seeds (almost always) produce different sequences', () => {
    const a = peekNext(createBagState(1), 20);
    const b = peekNext(createBagState(2), 20);
    expect(a).not.toEqual(b);
  });

  it('peekNext does not consume from the bag', () => {
    const bag = createBagState(42);
    const peeked = peekNext(bag, 5);
    const { piece } = drawNext(bag);
    expect(piece).toBe(peeked[0]);
  });
});
