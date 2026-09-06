import { z } from 'zod';

/**
 * Shared contracts between apps/web and (from Phase 4 onward) apps/api.
 * Kept as Zod schemas rather than plain TS types so the exact same runtime
 * validation logic guards both the client's localStorage reads and the
 * server's run-submission endpoint — one source of truth for "what is a
 * valid run", not two hand-maintained copies.
 */

export const gameModeSchema = z.enum(['marathon', 'sprint', 'ultra', 'zen']);
export type GameModeDto = z.infer<typeof gameModeSchema>;

export const difficultyPresetNameSchema = z.enum(['chill', 'classic', 'expert', 'insane', 'custom']);
export type DifficultyPresetNameDto = z.infer<typeof difficultyPresetNameSchema>;

export const difficultyPresetSchema = z.object({
  name: difficultyPresetNameSchema,
  startLevel: z.number().int().min(1).max(20),
  gravityMultiplier: z.number().positive().max(10),
  lockDelayMs: z.number().int().min(0).max(5000),
  lockDelayMaxResets: z.number().int().min(0).max(100),
  nextQueueSize: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  ghostPieceEnabled: z.boolean(),
  holdEnabled: z.boolean(),
});
export type DifficultyPresetDto = z.infer<typeof difficultyPresetSchema>;

export const actionTypeSchema = z.enum([
  'move-left',
  'move-right',
  'soft-drop-start',
  'soft-drop-end',
  'hard-drop',
  'rotate-cw',
  'rotate-ccw',
  'rotate-180',
  'hold',
]);

export const timedActionSchema = z.object({
  frame: z.number().int().min(0),
  action: z.object({ type: actionTypeSchema }),
});
export type TimedActionDto = z.infer<typeof timedActionSchema>;

export const gameConfigSchema = z.object({
  mode: gameModeSchema,
  preset: difficultyPresetSchema,
  seed: z.number().int().min(0).max(2 ** 32 - 1),
  lineTarget: z.number().int().min(0),
  timeLimitMs: z.number().int().min(0),
});
export type GameConfigDto = z.infer<typeof gameConfigSchema>;

export const claimedResultSchema = z.object({
  score: z.number().int().min(0),
  lines: z.number().int().min(0),
  level: z.number().int().min(1),
  frames: z.number().int().min(0),
  durationMs: z.number().int().min(0),
  topOut: z.boolean(),
  finishedByLineTarget: z.boolean(),
  finishedByTimeLimit: z.boolean(),
});

/** What the client POSTs when a run ends. Server re-derives the result via `replay()`
 * from `@tetris/engine` and only trusts that recomputation — `claimedResult` is kept
 * purely so a mismatch can be logged/flagged, never as the value that gets ranked. */
export const runSubmissionSchema = z.object({
  engineVersion: z.string(),
  config: gameConfigSchema,
  inputLog: z.array(timedActionSchema).max(200_000),
  claimedResult: claimedResultSchema,
  clientRunId: z.string().uuid(),
});
export type RunSubmissionDto = z.infer<typeof runSubmissionSchema>;

export const leaderboardEntrySchema = z.object({
  rank: z.number().int().min(1),
  playerName: z.string().min(1).max(40),
  score: z.number().int().min(0),
  lines: z.number().int().min(0),
  durationMs: z.number().int().min(0),
  mode: gameModeSchema,
  preset: difficultyPresetNameSchema,
  achievedAt: z.string().datetime(),
});
export type LeaderboardEntryDto = z.infer<typeof leaderboardEntrySchema>;

/** Local (offline, unverified) high-score record kept in the browser before any backend exists. */
export const localHighScoreSchema = z.object({
  score: z.number().int().min(0),
  lines: z.number().int().min(0),
  level: z.number().int().min(1),
  durationMs: z.number().int().min(0),
  mode: gameModeSchema,
  preset: difficultyPresetNameSchema,
  achievedAt: z.string().datetime(),
});
export type LocalHighScoreDto = z.infer<typeof localHighScoreSchema>;
