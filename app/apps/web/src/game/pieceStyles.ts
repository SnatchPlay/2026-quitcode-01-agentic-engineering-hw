import type { TetrominoType } from '@tetris/engine';

/**
 * Tetromino colors, deliberately desaturated/toned rather than the classic
 * neon-arcade palette — this is meant to sit next to Porsche Design System
 * components without clashing with its restrained, "configurator" aesthetic.
 * Each also gets a single-letter glyph for the color-blind-friendly mode.
 */
export const PIECE_STYLE: Record<TetrominoType, { color: string; glow: string; glyph: string }> = {
  I: { color: '#3fb6c9', glow: 'rgba(63,182,201,0.55)', glyph: 'I' },
  O: { color: '#d9b64c', glow: 'rgba(217,182,76,0.55)', glyph: 'O' },
  T: { color: '#a26fd9', glow: 'rgba(162,111,217,0.55)', glyph: 'T' },
  S: { color: '#5fb87c', glow: 'rgba(95,184,124,0.55)', glyph: 'S' },
  Z: { color: '#d1585f', glow: 'rgba(209,88,95,0.55)', glyph: 'Z' },
  J: { color: '#5c84d6', glow: 'rgba(92,132,214,0.55)', glyph: 'J' },
  L: { color: '#d98a45', glow: 'rgba(217,138,69,0.55)', glyph: 'L' },
};
