import { describe, expect, it } from 'vitest';
import { clearKindFromLineCount, levelForLines, scoreLineClear } from './scoring.js';

describe('scoring table', () => {
  it('matches the Tetris Guideline base values at level 1, no combo/B2B/PC', () => {
    const base = (kind: Parameters<typeof scoreLineClear>[0]['kind']) =>
      scoreLineClear({ kind, level: 1, combo: 0, backToBack: false, perfectClear: false, perfectClearWasTetris: false });

    expect(base('single')).toBe(100);
    expect(base('double')).toBe(300);
    expect(base('triple')).toBe(500);
    expect(base('tetris')).toBe(800);
    expect(base('tspin-mini')).toBe(100);
    expect(base('tspin-single')).toBe(800);
    expect(base('tspin-double')).toBe(1200);
    expect(base('tspin-triple')).toBe(1600);
  });

  it('scales linearly with level', () => {
    const at = (level: number) =>
      scoreLineClear({ kind: 'single', level, combo: 0, backToBack: false, perfectClear: false, perfectClearWasTetris: false });
    expect(at(5)).toBe(500);
    expect(at(10)).toBe(1000);
  });

  it('applies a x1.5 back-to-back bonus only to B2B-eligible clears', () => {
    const tetrisB2B = scoreLineClear({
      kind: 'tetris',
      level: 1,
      combo: 0,
      backToBack: true,
      perfectClear: false,
      perfectClearWasTetris: false,
    });
    expect(tetrisB2B).toBe(1200); // 800 * 1.5

    const singleB2B = scoreLineClear({
      kind: 'single',
      level: 1,
      combo: 0,
      backToBack: true,
      perfectClear: false,
      perfectClearWasTetris: false,
    });
    expect(singleB2B).toBe(100); // singles never qualify for B2B
  });

  it('adds a combo bonus proportional to combo count and level', () => {
    const withCombo = scoreLineClear({
      kind: 'single',
      level: 2,
      combo: 3,
      backToBack: false,
      perfectClear: false,
      perfectClearWasTetris: false,
    });
    expect(withCombo).toBe(200 + 50 * 3 * 2);
  });

  it('classifies clears by line count and T-spin flags', () => {
    expect(clearKindFromLineCount(1, false, false)).toBe('single');
    expect(clearKindFromLineCount(4, false, false)).toBe('tetris');
    expect(clearKindFromLineCount(0, true, true)).toBe('tspin-mini');
    expect(clearKindFromLineCount(1, true, false)).toBe('tspin-single');
    expect(clearKindFromLineCount(2, true, false)).toBe('tspin-double');
    expect(clearKindFromLineCount(3, true, false)).toBe('tspin-triple');
  });
});

describe('level progression', () => {
  it('advances one level every 10 lines, from the preset start level', () => {
    expect(levelForLines(1, 0)).toBe(1);
    expect(levelForLines(1, 9)).toBe(1);
    expect(levelForLines(1, 10)).toBe(2);
    expect(levelForLines(5, 25)).toBe(7);
  });
});
