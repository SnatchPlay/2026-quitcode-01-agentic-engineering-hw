import type { DifficultyPreset, DifficultyPresetName } from './types.js';

export const DIFFICULTY_PRESETS: Record<Exclude<DifficultyPresetName, 'custom'>, DifficultyPreset> = {
  chill: {
    name: 'chill',
    startLevel: 1,
    gravityMultiplier: 0.6,
    lockDelayMs: 700,
    lockDelayMaxResets: 20,
    nextQueueSize: 5,
    ghostPieceEnabled: true,
    holdEnabled: true,
  },
  classic: {
    name: 'classic',
    startLevel: 1,
    gravityMultiplier: 1,
    lockDelayMs: 500,
    lockDelayMaxResets: 15,
    nextQueueSize: 5,
    ghostPieceEnabled: true,
    holdEnabled: true,
  },
  expert: {
    name: 'expert',
    startLevel: 5,
    gravityMultiplier: 1.5,
    lockDelayMs: 300,
    lockDelayMaxResets: 8,
    nextQueueSize: 3,
    ghostPieceEnabled: false,
    holdEnabled: true,
  },
  insane: {
    name: 'insane',
    startLevel: 10,
    gravityMultiplier: 2.5,
    lockDelayMs: 150,
    lockDelayMaxResets: 4,
    nextQueueSize: 1,
    ghostPieceEnabled: false,
    holdEnabled: false,
  },
};

export function customPreset(overrides: Partial<DifficultyPreset>): DifficultyPreset {
  return { ...DIFFICULTY_PRESETS.classic, ...overrides, name: 'custom' };
}
