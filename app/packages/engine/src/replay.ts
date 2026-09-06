import { createGame, step } from './engine.js';
import type { GameConfig, GameState, RunResult, TimedAction } from './types.js';
import { FRAME_MS } from './types.js';

/** Safety cap so a malformed/malicious input log can't spin the verifier forever. */
const MAX_FRAMES = 60 * 60 * 30; // 30 minutes of simulated play

/**
 * Deterministically replays a recorded input log against a fresh game created
 * from `config` (which embeds the run's seed). Given the same engine version,
 * config, and input log, this produces byte-for-byte the same `RunResult` on
 * any machine — that identity is the whole point: the server re-derives the
 * score instead of trusting whatever the client claims.
 */
export function replay(config: GameConfig, inputLog: readonly TimedAction[]): RunResult {
  let state: GameState = createGame(config);
  const byFrame = new Map<number, TimedAction[]>();
  for (const entry of inputLog) {
    const list = byFrame.get(entry.frame) ?? [];
    list.push(entry);
    byFrame.set(entry.frame, list);
  }

  const lastInputFrame = inputLog.reduce((max, e) => Math.max(max, e.frame), 0);
  let frame = 0;
  while (state.phase === 'playing' && frame <= Math.max(lastInputFrame, frame) && frame < MAX_FRAMES) {
    const actions = (byFrame.get(frame) ?? []).map((e) => e.action);
    state = step(state, actions);
    frame++;
    if (frame > lastInputFrame && byFrame.size > 0 && state.phase === 'playing') {
      // No more recorded input and the game hasn't ended: this is a legitimately
      // unfinished run (player quit mid-game) rather than a replay bug — stop here.
      break;
    }
  }

  return {
    score: state.score,
    lines: state.lines,
    level: state.level,
    frames: state.frame,
    durationMs: state.frame * FRAME_MS,
    topOut: state.phase === 'topped-out',
    finishedByLineTarget: state.phase === 'finished' && config.lineTarget > 0 && state.lines >= config.lineTarget,
    finishedByTimeLimit: state.phase === 'finished' && config.timeLimitMs > 0,
  };
}
