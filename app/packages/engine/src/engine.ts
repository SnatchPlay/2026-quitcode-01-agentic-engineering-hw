import {
  clearRows,
  createEmptyBoard,
  dropDistance,
  findFullRows,
  isBoardEmpty,
  isGrounded,
  isValidPlacement,
  mergePiece,
  pieceCells,
} from './board.js';
import { createBagState, drawNext, peekNext } from './rng.js';
import {
  clearKindFromLineCount,
  gravityRowsPerSecond,
  hardDropScore,
  qualifiesForBackToBack,
  scoreLineClear,
  softDropScore,
} from './scoring.js';
import { getKickTable, rotateCcw, rotateCw, spawnPosition } from './tetrominoes.js';
import type { ActivePiece, GameAction, GameConfig, GameState, RotationState, Vec2 } from './types.js';
import { BOARD_BUFFER_HEIGHT, FRAME_MS } from './types.js';

/** Rows/second while soft-drop is held — fast, but distinct from an instant hard drop. */
const SOFT_DROP_ROWS_PER_SECOND = 20;
const SPAWN_TOP_ROW = 17;

export function createGame(config: GameConfig): GameState {
  const bagState = createBagState(config.seed);
  const { piece: firstType, bag: afterFirst } = drawNext(bagState);
  const active = spawnActivePiece(firstType);

  return {
    config,
    board: createEmptyBoard(),
    active,
    holdPiece: null,
    holdUsedThisPiece: false,
    nextQueue: peekNext(afterFirst, config.preset.nextQueueSize),
    bagState: afterFirst,
    phase: 'playing',
    frame: 0,
    score: 0,
    lines: 0,
    level: config.preset.startLevel,
    combo: -1,
    backToBack: false,
    softDropHeld: false,
    gravityAccumulator: 0,
    lockDelayRemainingMs: null,
    lockDelayResetsUsed: 0,
    lastRotationWasKick: false,
    lastKickIndex: -1,
    lastActionWasRotation: false,
    gameOverReason: null,
    events: [],
  };
}

function spawnActivePiece(type: ActivePiece['type']): ActivePiece {
  return { type, rotation: 'SPAWN', position: spawnPosition(type, SPAWN_TOP_ROW) };
}

/**
 * Advances the simulation by exactly one fixed 60fps frame, applying the given
 * discrete actions first (in array order) and then gravity/lock-delay. Callers
 * (the browser game loop, or the server-side replay verifier) are responsible
 * for calling this once per accumulated 1/60s tick — the engine itself has no
 * notion of wall-clock time, which is what makes `replay()` reproducible.
 */
export function step(state: GameState, actions: GameAction[]): GameState {
  if (state.phase !== 'playing') return state;

  // Events are per-frame: clear whatever the *previous* step produced before
  // this frame's actions/gravity/lock-delay get a chance to populate new ones.
  let next: GameState = { ...state, events: [] };
  for (const action of actions) {
    next = applyAction(next, action);
    if (next.phase !== 'playing') return { ...next, frame: next.frame + 1 };
  }

  next = applyGravity(next);
  next = applyLockDelay(next);
  const newFrame = next.frame + 1;
  const timeLimitHit =
    next.config.timeLimitMs > 0 && newFrame * FRAME_MS >= next.config.timeLimitMs && next.phase === 'playing';
  next = {
    ...next,
    frame: newFrame,
    phase: timeLimitHit ? 'finished' : next.phase,
  };
  return next;
}

function applyAction(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'move-left':
      return tryTranslate(state, { x: -1, y: 0 });
    case 'move-right':
      return tryTranslate(state, { x: 1, y: 0 });
    case 'soft-drop-start':
      return { ...state, softDropHeld: true };
    case 'soft-drop-end':
      return { ...state, softDropHeld: false };
    case 'rotate-cw':
      return tryRotate(state, 'cw');
    case 'rotate-ccw':
      return tryRotate(state, 'ccw');
    case 'rotate-180':
      return tryRotate180(state);
    case 'hold':
      return tryHold(state);
    case 'hard-drop':
      return hardDrop(state);
    default:
      return state;
  }
}

function tryTranslate(state: GameState, delta: Vec2): GameState {
  if (!state.active) return state;
  const moved: ActivePiece = {
    ...state.active,
    position: { x: state.active.position.x + delta.x, y: state.active.position.y + delta.y },
  };
  if (!isValidPlacement(state.board, moved)) return state;
  return refreshLockDelayIfGrounded({ ...state, active: moved, lastActionWasRotation: false });
}

function tryRotate(state: GameState, direction: 'cw' | 'ccw'): GameState {
  if (!state.active) return state;
  const from = state.active.rotation;
  const to = direction === 'cw' ? rotateCw(from) : rotateCcw(from);
  const kicks = getKickTable(state.active.type, from, to);
  for (let i = 0; i < kicks.length; i++) {
    const offset = kicks[i]!;
    const candidate: ActivePiece = {
      type: state.active.type,
      rotation: to,
      position: { x: state.active.position.x + offset.x, y: state.active.position.y + offset.y },
    };
    if (isValidPlacement(state.board, candidate)) {
      return refreshLockDelayIfGrounded({
        ...state,
        active: candidate,
        lastActionWasRotation: true,
        lastRotationWasKick: i > 0,
        lastKickIndex: i,
      });
    }
  }
  return state;
}

function tryRotate180(state: GameState): GameState {
  const once = tryRotate(state, 'cw');
  if (once.active?.rotation === state.active?.rotation) return state; // first 90° failed entirely
  return tryRotate({ ...once }, 'cw');
}

function refreshLockDelayIfGrounded(state: GameState): GameState {
  if (!state.active) return state;
  if (!isGrounded(state.board, state.active)) {
    return { ...state, lockDelayRemainingMs: null, lockDelayResetsUsed: 0 };
  }
  if (state.lockDelayRemainingMs === null) {
    // Just touched down for the first time this piece; timer starts in applyLockDelay.
    return state;
  }
  if (state.lockDelayResetsUsed >= state.config.preset.lockDelayMaxResets) {
    return state; // move/rotate still allowed, but no more free time
  }
  return {
    ...state,
    lockDelayRemainingMs: state.config.preset.lockDelayMs,
    lockDelayResetsUsed: state.lockDelayResetsUsed + 1,
  };
}

function tryHold(state: GameState): GameState {
  if (!state.active || !state.config.preset.holdEnabled || state.holdUsedThisPiece) return state;
  const currentType = state.active.type;
  if (state.holdPiece === null) {
    const { piece, afterQueue, bag } = popNextFromQueue(state);
    return {
      ...state,
      holdPiece: currentType,
      active: spawnActivePiece(piece),
      nextQueue: afterQueue,
      bagState: bag,
      holdUsedThisPiece: true,
      lockDelayRemainingMs: null,
      lockDelayResetsUsed: 0,
      lastActionWasRotation: false,
    };
  }
  return {
    ...state,
    holdPiece: currentType,
    active: spawnActivePiece(state.holdPiece),
    holdUsedThisPiece: true,
    lockDelayRemainingMs: null,
    lockDelayResetsUsed: 0,
    lastActionWasRotation: false,
  };
}

function popNextFromQueue(state: GameState) {
  const { piece, bag } = drawNext(state.bagState);
  const afterQueue = peekNext(bag, state.config.preset.nextQueueSize);
  return { piece, afterQueue, bag };
}

function hardDrop(state: GameState): GameState {
  if (!state.active) return state;
  const distance = dropDistance(state.board, state.active);
  const dropped: ActivePiece = {
    ...state.active,
    position: { x: state.active.position.x, y: state.active.position.y + distance },
  };
  const scored = { ...state, active: dropped, score: state.score + hardDropScore(distance) };
  return lockActivePiece(scored);
}

function applyGravity(state: GameState): GameState {
  if (!state.active) return state;
  const natural = gravityRowsPerSecond(state.level, state.config.preset.gravityMultiplier);
  const effective = state.softDropHeld ? Math.max(natural, SOFT_DROP_ROWS_PER_SECOND) : natural;
  let accumulator = state.gravityAccumulator + effective / 60;
  let current = state.active;
  let scoreGain = 0;

  while (accumulator >= 1) {
    const moved: ActivePiece = { ...current, position: { x: current.position.x, y: current.position.y + 1 } };
    if (!isValidPlacement(state.board, moved)) {
      accumulator = 0;
      break;
    }
    current = moved;
    accumulator -= 1;
    if (state.softDropHeld) scoreGain += softDropScore(1);
  }

  return { ...state, active: current, gravityAccumulator: accumulator, score: state.score + scoreGain };
}

function applyLockDelay(state: GameState): GameState {
  if (!state.active) return state;
  if (!isGrounded(state.board, state.active)) {
    return { ...state, lockDelayRemainingMs: null };
  }
  const remaining = state.lockDelayRemainingMs ?? state.config.preset.lockDelayMs;
  const nextRemaining = remaining - FRAME_MS;
  if (nextRemaining <= 0) {
    return lockActivePiece(state);
  }
  return { ...state, lockDelayRemainingMs: nextRemaining };
}

/** The 4 corners of a T piece's 3x3 bounding box, used by the "3-corner" T-spin test. */
function tSpinCorners(piece: ActivePiece): { front: Vec2[]; back: Vec2[] } {
  const { x, y } = piece.position;
  const topLeft = { x, y };
  const topRight = { x: x + 2, y };
  const bottomLeft = { x, y: y + 2 };
  const bottomRight = { x: x + 2, y: y + 2 };
  switch (piece.rotation) {
    case 'SPAWN': // point faces up
      return { front: [topLeft, topRight], back: [bottomLeft, bottomRight] };
    case 'CW': // point faces right
      return { front: [topRight, bottomRight], back: [topLeft, bottomLeft] };
    case 'FLIP': // point faces down
      return { front: [bottomLeft, bottomRight], back: [topLeft, topRight] };
    case 'CCW': // point faces left
      return { front: [topLeft, bottomLeft], back: [topRight, bottomRight] };
  }
}

function detectTSpin(state: GameState, piece: ActivePiece): { isTSpin: boolean; isMini: boolean } {
  if (piece.type !== 'T' || !state.lastActionWasRotation) return { isTSpin: false, isMini: false };
  const isFilled = (cell: Vec2): boolean => {
    if (cell.x < 0 || cell.x >= 10 || cell.y >= state.board.length) return true; // wall/floor counts as filled
    if (cell.y < 0) return false;
    return state.board[cell.y]![cell.x] !== null;
  };
  const { front, back } = tSpinCorners(piece);
  const frontFilled = front.filter(isFilled).length;
  const backFilled = back.filter(isFilled).length;
  if (frontFilled + backFilled < 3) return { isTSpin: false, isMini: false };
  // The final ("test 5", index 4) SRS kick always promotes a corner-ambiguous
  // spin into a *full* T-spin, per the Guideline's T-Spin Overrides rule.
  const kickOverride = state.lastRotationWasKick && state.lastKickIndex === 4;
  const isMini = frontFilled < 2 && !kickOverride;
  return { isTSpin: true, isMini };
}

function lockActivePiece(state: GameState): GameState {
  if (!state.active) return state;
  const piece = state.active;

  // Lock-out: the entire piece locked while still inside the hidden buffer zone.
  const cells = pieceCells(piece);
  const allHidden = cells.every((c) => c.y < BOARD_BUFFER_HEIGHT);

  const { isTSpin, isMini } = detectTSpin(state, piece);
  const mergedBoard = mergePiece(state.board, piece);
  const fullRows = findFullRows(mergedBoard);
  const clearedBoard = clearRows(mergedBoard, fullRows);
  const linesCleared = fullRows.length;
  const perfectClear = linesCleared > 0 && isBoardEmpty(clearedBoard);

  const kind = clearKindFromLineCount(linesCleared, isTSpin, isMini);
  const isB2BEligible = qualifiesForBackToBack(kind);
  const backToBackBonusApplies = linesCleared > 0 && isB2BEligible && state.backToBack;
  const newBackToBack =
    linesCleared === 0 ? state.backToBack : isB2BEligible ? true : false;
  const newCombo = linesCleared > 0 ? state.combo + 1 : -1;

  const scoreDelta =
    linesCleared > 0 || isTSpin
      ? scoreLineClear({
          kind,
          level: state.level,
          combo: Math.max(newCombo, 0),
          backToBack: backToBackBonusApplies,
          perfectClear,
          perfectClearWasTetris: perfectClear && kind === 'tetris' && backToBackBonusApplies,
        })
      : 0;

  const totalLines = state.lines + linesCleared;
  const newLevel = state.config.preset.startLevel + Math.floor(totalLines / 10);

  if (allHidden && linesCleared === 0) {
    return {
      ...state,
      board: mergedBoard,
      active: null,
      phase: 'topped-out',
      gameOverReason: 'lock-out',
    };
  }

  const lineTargetHit = state.config.lineTarget > 0 && totalLines >= state.config.lineTarget;

  const { piece: nextType, afterQueue, bag } = popNextFromQueue(state);
  const spawned = spawnActivePiece(nextType);
  const spawnBlocked = !isValidPlacement(clearedBoard, spawned);

  const event =
    linesCleared > 0 || isTSpin
      ? [
          {
            frame: state.frame,
            kind,
            rows: fullRows,
            combo: Math.max(newCombo, 0),
            backToBack: backToBackBonusApplies,
            perfectClear,
            scoreDelta,
          },
        ]
      : [];

  return {
    ...state,
    board: clearedBoard,
    active: spawnBlocked ? null : spawned,
    nextQueue: afterQueue,
    bagState: bag,
    holdUsedThisPiece: false,
    score: state.score + scoreDelta,
    lines: totalLines,
    level: newLevel,
    combo: newCombo,
    backToBack: newBackToBack,
    lockDelayRemainingMs: null,
    lockDelayResetsUsed: 0,
    lastActionWasRotation: false,
    lastRotationWasKick: false,
    lastKickIndex: -1,
    gravityAccumulator: 0,
    phase: spawnBlocked ? 'topped-out' : lineTargetHit ? 'finished' : 'playing',
    gameOverReason: spawnBlocked ? 'block-out' : null,
    events: event,
  };
}

export function isRotationState(value: string): value is RotationState {
  return value === 'SPAWN' || value === 'CW' || value === 'FLIP' || value === 'CCW';
}

export type { GameConfig };
