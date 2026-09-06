'use client';

import { createGame, step, FRAME_MS } from '@tetris/engine';
import type { GameConfig, GameState, LineClearEvent, TimedAction } from '@tetris/engine';
import { useCallback, useEffect, useRef, useState } from 'react';
import { InputController } from './inputController';
import { useSettingsStore } from '@/store/settingsStore';

/** How often (in simulated frames) the throttled React snapshot is republished. ~12Hz at 60fps. */
const PUBLISH_EVERY_N_FRAMES = 5;
/** Guards against a huge dt spike (tab backgrounded, debugger pause) causing a "spiral of death". */
const MAX_FRAMES_PER_RAF = 8;

export interface GameSnapshot {
  score: number;
  lines: number;
  level: number;
  combo: number;
  backToBack: boolean;
  phase: GameState['phase'];
  gameOverReason: GameState['gameOverReason'];
  holdPiece: GameState['holdPiece'];
  holdUsedThisPiece: boolean;
  nextQueue: GameState['nextQueue'];
  frame: number;
  timeRemainingMs: number | null;
}

function toSnapshot(state: GameState): GameSnapshot {
  const timeRemainingMs =
    state.config.timeLimitMs > 0 ? Math.max(0, state.config.timeLimitMs - state.frame * FRAME_MS) : null;
  return {
    score: state.score,
    lines: state.lines,
    level: state.level,
    combo: state.combo,
    backToBack: state.backToBack,
    phase: state.phase,
    gameOverReason: state.gameOverReason,
    holdPiece: state.holdPiece,
    holdUsedThisPiece: state.holdUsedThisPiece,
    nextQueue: state.nextQueue,
    frame: state.frame,
    timeRemainingMs,
  };
}

export interface GameLoopHandle {
  snapshot: GameSnapshot;
  /** Imperative escape hatch for the DOM/canvas renderer, which repaints every rAF tick and
   * cannot afford to wait for the throttled React snapshot above. */
  getLiveState: () => GameState;
  subscribeEvents: (cb: (event: LineClearEvent) => void) => () => void;
  pause: () => void;
  resume: () => void;
  restart: (config: GameConfig) => void;
  consumePausePress: () => boolean;
  /** Full recorded input log for this run — the same log a future backend would replay to verify the score. */
  getInputLog: () => TimedAction[];
}

export function useGameLoop(initialConfig: GameConfig): GameLoopHandle {
  // Computed via useState (not read off the ref) so the lazy initializer below
  // never has to access `stateRef.current` during render — react-hooks/refs
  // flags that as unsafe even though it's only ever read on the very first render.
  const [initialState] = useState(() => createGame(initialConfig));
  const stateRef = useRef<GameState>(initialState);
  const [snapshot, setSnapshot] = useState<GameSnapshot>(() => toSnapshot(initialState));
  const eventSubscribers = useRef(new Set<(event: LineClearEvent) => void>());
  const inputLogRef = useRef<TimedAction[]>([]);
  const controllerRef = useRef<InputController | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const accumulatorRef = useRef(0);
  const publishCounterRef = useRef(0);
  const runningRef = useRef(true);

  // Selected individually (not as `(s) => ({ ...})`) — zustand's useSyncExternalStore-based
  // hook requires getSnapshot to return a stable reference when nothing changed; a fresh
  // object literal every render fails that check and causes an infinite update loop.
  const keyBindings = useSettingsStore((s) => s.keyBindings);
  const das = useSettingsStore((s) => s.das);
  const arr = useSettingsStore((s) => s.arr);

  useEffect(() => {
    controllerRef.current = new InputController(keyBindings, das, arr);
    controllerRef.current.attach();
    return () => controllerRef.current?.detach();
    // Only recreate the listener on mount; live setting changes go through updateSettings below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    controllerRef.current?.updateSettings(keyBindings, das, arr);
  }, [keyBindings, das, arr]);

  const publish = useCallback((force: boolean) => {
    publishCounterRef.current += 1;
    if (force || publishCounterRef.current >= PUBLISH_EVERY_N_FRAMES) {
      publishCounterRef.current = 0;
      setSnapshot(toSnapshot(stateRef.current));
    }
  }, []);

  useEffect(() => {
    lastTimeRef.current = null;
    accumulatorRef.current = 0;

    const tick = (time: number) => {
      rafRef.current = requestAnimationFrame(tick);
      if (!runningRef.current) {
        lastTimeRef.current = time;
        return;
      }
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
        return;
      }
      const dt = time - lastTimeRef.current;
      lastTimeRef.current = time;
      accumulatorRef.current = Math.min(accumulatorRef.current + dt, FRAME_MS * MAX_FRAMES_PER_RAF);

      let framesRun = 0;
      let sawEvents = false;
      let phaseChanged = false;
      const startingPhase = stateRef.current.phase;

      while (accumulatorRef.current >= FRAME_MS && framesRun < MAX_FRAMES_PER_RAF) {
        const controller = controllerRef.current;
        if (stateRef.current.phase === 'playing' && controller?.consumePausePress()) {
          stateRef.current = { ...stateRef.current, phase: 'paused' };
          phaseChanged = true;
          break;
        }
        if (stateRef.current.phase !== 'playing') break;

        const actions = controller?.update(FRAME_MS) ?? [];
        const frameNumber = stateRef.current.frame;
        for (const action of actions) {
          inputLogRef.current.push({ frame: frameNumber, action });
        }
        stateRef.current = step(stateRef.current, actions);
        accumulatorRef.current -= FRAME_MS;
        framesRun++;

        if (stateRef.current.events.length > 0) {
          sawEvents = true;
          for (const event of stateRef.current.events) {
            for (const cb of eventSubscribers.current) cb(event);
          }
        }
      }

      if (stateRef.current.phase !== startingPhase) phaseChanged = true;
      publish(phaseChanged || sawEvents);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [publish]);

  const pause = useCallback(() => {
    if (stateRef.current.phase === 'playing') {
      stateRef.current = { ...stateRef.current, phase: 'paused' };
      publish(true);
    }
  }, [publish]);

  const resume = useCallback(() => {
    if (stateRef.current.phase === 'paused') {
      stateRef.current = { ...stateRef.current, phase: 'playing' };
      publish(true);
    }
  }, [publish]);

  const restart = useCallback(
    (config: GameConfig) => {
      stateRef.current = createGame(config);
      inputLogRef.current = [];
      accumulatorRef.current = 0;
      lastTimeRef.current = null;
      publish(true);
    },
    [publish],
  );

  const subscribeEvents = useCallback((cb: (event: LineClearEvent) => void) => {
    eventSubscribers.current.add(cb);
    return () => eventSubscribers.current.delete(cb);
  }, []);

  return {
    snapshot,
    getLiveState: () => stateRef.current,
    subscribeEvents,
    pause,
    resume,
    restart,
    consumePausePress: () => controllerRef.current?.consumePausePress() ?? false,
    getInputLog: () => inputLogRef.current,
  };
}
