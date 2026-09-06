import type { GameAction } from '@tetris/engine';
import type { KeyBindings } from '@/store/settingsStore';

const PREVENT_DEFAULT_CODES = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Space',
  'KeyZ',
  'KeyA',
  'KeyC',
]);

interface RepeatableKey {
  /** ms since the key went down; null while the key is up. */
  heldForMs: number | null;
  /** ms accumulated since the last repeat fired, once DAS has elapsed. */
  sinceLastRepeat: number;
}

/**
 * Owns keyboard state and turns it into discrete, frame-tagged engine actions.
 *
 * This is deliberately *not* relying on the browser's native key-repeat: OS/browser
 * repeat rates vary per machine, which would make the feel (and any recorded
 * replay) non-portable. Instead we track raw keydown/keyup edges ourselves and
 * run our own DAS (Delayed Auto Shift) / ARR (Auto Repeat Rate) timers, advanced
 * in lockstep with the fixed-timestep game loop — so "how the game feels" and
 * "what a replay contains" are the same deterministic thing.
 */
export class InputController {
  private keyBindings: KeyBindings;
  private das: number;
  private arr: number;
  private codeToAction = new Map<string, keyof KeyBindings>();
  private oneShotPending: (keyof KeyBindings)[] = [];
  private movement: Record<'moveLeft' | 'moveRight', RepeatableKey> = {
    moveLeft: { heldForMs: null, sinceLastRepeat: 0 },
    moveRight: { heldForMs: null, sinceLastRepeat: 0 },
  };
  private softDropHeld = false;
  private pausePressed = false;
  private onKeyDown: (e: KeyboardEvent) => void;
  private onKeyUp: (e: KeyboardEvent) => void;

  constructor(keyBindings: KeyBindings, das: number, arr: number) {
    this.keyBindings = keyBindings;
    this.das = das;
    this.arr = arr;
    this.rebuildCodeMap();

    this.onKeyDown = (e: KeyboardEvent) => {
      if (PREVENT_DEFAULT_CODES.has(e.code)) e.preventDefault();
      if (e.repeat) return; // ignore native OS repeat entirely; we do our own
      const action = this.codeToAction.get(e.code);
      if (!action) return;
      this.handleKeyDown(action);
    };
    this.onKeyUp = (e: KeyboardEvent) => {
      const action = this.codeToAction.get(e.code);
      if (!action) return;
      this.handleKeyUp(action);
    };
  }

  attach(target: Window = window): void {
    target.addEventListener('keydown', this.onKeyDown);
    target.addEventListener('keyup', this.onKeyUp);
  }

  detach(target: Window = window): void {
    target.removeEventListener('keydown', this.onKeyDown);
    target.removeEventListener('keyup', this.onKeyUp);
  }

  updateSettings(keyBindings: KeyBindings, das: number, arr: number): void {
    this.keyBindings = keyBindings;
    this.das = das;
    this.arr = arr;
    this.rebuildCodeMap();
  }

  private rebuildCodeMap(): void {
    this.codeToAction = new Map(
      (Object.entries(this.keyBindings) as [keyof KeyBindings, string][]).map(([action, code]) => [code, action]),
    );
  }

  private handleKeyDown(action: keyof KeyBindings): void {
    switch (action) {
      case 'moveLeft':
      case 'moveRight':
        if (this.movement[action].heldForMs === null) {
          this.movement[action] = { heldForMs: 0, sinceLastRepeat: 0 };
          this.oneShotPending.push(action); // immediate first move (test 0 of DAS)
        }
        break;
      case 'softDrop':
        if (!this.softDropHeld) {
          this.softDropHeld = true;
          this.oneShotPending.push('softDrop');
        }
        break;
      case 'pause':
        this.pausePressed = true;
        break;
      default:
        this.oneShotPending.push(action);
    }
  }

  private handleKeyUp(action: keyof KeyBindings): void {
    if (action === 'moveLeft' || action === 'moveRight') {
      this.movement[action] = { heldForMs: null, sinceLastRepeat: 0 };
    } else if (action === 'softDrop') {
      this.softDropHeld = false;
    }
  }

  consumePausePress(): boolean {
    const pressed = this.pausePressed;
    this.pausePressed = false;
    return pressed;
  }

  /** Advances DAS/ARR timers by one fixed frame and returns this frame's engine actions. */
  update(frameMs: number): GameAction[] {
    const actions: GameAction[] = [];

    for (const shot of this.oneShotPending) {
      const mapped = toEngineAction(shot, this.softDropHeld);
      if (mapped) actions.push(mapped);
    }
    this.oneShotPending = [];

    for (const key of ['moveLeft', 'moveRight'] as const) {
      const state = this.movement[key];
      if (state.heldForMs === null) continue;
      state.heldForMs += frameMs;
      if (state.heldForMs < this.das) continue;
      state.sinceLastRepeat += frameMs;
      // arr === 0 means "as fast as the simulation can go": fire every frame once DAS has elapsed.
      if (this.arr === 0 || state.sinceLastRepeat >= this.arr) {
        state.sinceLastRepeat = 0;
        actions.push({ type: key === 'moveLeft' ? 'move-left' : 'move-right' });
      }
    }

    return actions;
  }
}

function toEngineAction(action: keyof KeyBindings, softDropHeld: boolean): GameAction | null {
  switch (action) {
    case 'moveLeft':
      return { type: 'move-left' };
    case 'moveRight':
      return { type: 'move-right' };
    case 'softDrop':
      return { type: softDropHeld ? 'soft-drop-start' : 'soft-drop-end' };
    case 'hardDrop':
      return { type: 'hard-drop' };
    case 'rotateCw':
      return { type: 'rotate-cw' };
    case 'rotateCcw':
      return { type: 'rotate-ccw' };
    case 'rotate180':
      return { type: 'rotate-180' };
    case 'hold':
      return { type: 'hold' };
    case 'pause':
      return null;
    default:
      return null;
  }
}
