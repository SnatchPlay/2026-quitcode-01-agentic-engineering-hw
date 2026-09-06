'use client';

import type { BoardCell, GameState, LineClearEvent } from '@tetris/engine';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BOARD_VISIBLE_HEIGHT, BOARD_WIDTH, ghostCells, pieceToVisibleCells, toVisibleRow } from '@/game/boardGeometry';
import { PIECE_STYLE } from '@/game/pieceStyles';
import type { GameSnapshot } from '@/game/useGameLoop';
import { useSettingsStore } from '@/store/settingsStore';
import { ParticleField, type ParticleFieldHandle } from './ParticleField';
import styles from './Board.module.css';

export interface BoardProps {
  getLiveState: () => GameState;
  subscribeEvents: (cb: (event: LineClearEvent) => void) => () => void;
  snapshot: GameSnapshot;
}

const BIG_CLEAR_KINDS = new Set<LineClearEvent['kind']>(['tetris', 'tspin-single', 'tspin-double', 'tspin-triple']);

export function Board({ getLiveState, subscribeEvents, snapshot }: BoardProps) {
  const colorBlindMode = useSettingsStore((s) => s.colorBlindMode);
  const reducedEffects = useSettingsStore((s) => s.reducedEffects);
  const boardRef = useRef<HTMLDivElement>(null);
  const activeCellRefs = useRef<(HTMLDivElement | null)[]>([]);
  const ghostCellRefs = useRef<(HTMLDivElement | null)[]>([]);
  const particleFieldRef = useRef<ParticleFieldHandle>(null);
  const [flashingRows, setFlashingRows] = useState<Set<number>>(new Set());
  const [shaking, setShaking] = useState(false);

  // Locked stack: re-derived at render time from the live engine state. Re-renders are driven
  // by `snapshot` changing (throttled ~12Hz, or forced immediately on lock/clear/phase-change
  // events by useGameLoop) — this layer intentionally does NOT repaint every animation frame.
  const lockedCells = useMemo(() => {
    const board = getLiveState().board;
    const rows: BoardCell[][] = [];
    for (let y = 0; y < BOARD_VISIBLE_HEIGHT; y++) rows.push(new Array(BOARD_WIDTH).fill(null));
    for (let boardY = 0; boardY < board.length; boardY++) {
      const visibleY = toVisibleRow(boardY);
      if (visibleY === null) continue;
      for (let x = 0; x < BOARD_WIDTH; x++) rows[visibleY]![x] = board[boardY]![x];
    }
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot]);

  useEffect(
    () =>
      subscribeEvents((event) => {
        if (!reducedEffects) {
          setFlashingRows(new Set(event.rows.map((r) => r - 20)));
          window.setTimeout(() => setFlashingRows(new Set()), 260);
          if (BIG_CLEAR_KINDS.has(event.kind) || event.perfectClear) {
            setShaking(true);
            window.setTimeout(() => setShaking(false), 240);
          }
          particleFieldRef.current?.burst(event);
        }
      }),
    [subscribeEvents, reducedEffects],
  );

  // Active + ghost piece: repainted every animation frame via direct DOM mutation (no React
  // state), so 60fps piece movement never triggers a React re-render of the whole board.
  useEffect(() => {
    let raf = 0;
    const paint = () => {
      raf = requestAnimationFrame(paint);
      const state = getLiveState();
      if (!state.active) return;
      const active = pieceToVisibleCells(state.active);
      const ghost = state.config.preset.ghostPieceEnabled ? ghostCells(state.board, state.active) : [];
      active.forEach((cell, i) => {
        const el = activeCellRefs.current[i];
        if (!el) return;
        el.style.transform = `translate3d(calc(${cell.x} * var(--cell)), calc(${cell.visibleY} * var(--cell)), 0)`;
        el.style.visibility = 'visible';
      });
      for (let i = active.length; i < 4; i++) {
        const el = activeCellRefs.current[i];
        if (el) el.style.visibility = 'hidden';
      }
      ghost.forEach((cell, i) => {
        const el = ghostCellRefs.current[i];
        if (!el) return;
        el.style.transform = `translate3d(calc(${cell.x} * var(--cell)), calc(${cell.visibleY} * var(--cell)), 0)`;
        el.style.visibility = 'visible';
      });
      for (let i = ghost.length; i < 4; i++) {
        const el = ghostCellRefs.current[i];
        if (el) el.style.visibility = 'hidden';
      }
    };
    raf = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(raf);
  }, [getLiveState]);

  const activeType = getLiveState().active?.type ?? 'T';
  const activeStyle = PIECE_STYLE[activeType];
  const ghostColorVar = { '--ghost-color': activeStyle.color } as React.CSSProperties;

  return (
    <div className={styles.frame}>
      <div ref={boardRef} className={`${styles.board} ${shaking ? styles.shake : ''}`}>
        <div className={styles.lockedGrid}>
          {lockedCells.map((row, y) =>
            row.map((cell, x) => (
              <div
                key={`${x}-${y}`}
                className={styles.lockedCell}
                data-clearing={flashingRows.has(y)}
                style={{
                  gridColumn: x + 1,
                  gridRow: y + 1,
                  background: cell ? PIECE_STYLE[cell].color : 'transparent',
                  boxShadow: cell ? `0 0 6px ${PIECE_STYLE[cell].glow} inset` : 'none',
                }}
              >
                {cell && colorBlindMode ? <span className={styles.glyph}>{PIECE_STYLE[cell].glyph}</span> : null}
              </div>
            )),
          )}
        </div>

        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={`ghost-${i}`}
            ref={(el) => {
              ghostCellRefs.current[i] = el;
            }}
            className={`${styles.pieceCell} ${styles.ghost}`}
            style={ghostColorVar}
          />
        ))}
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={`active-${i}`}
            ref={(el) => {
              activeCellRefs.current[i] = el;
            }}
            className={styles.pieceCell}
            style={{ background: activeStyle.color, boxShadow: `0 0 8px ${activeStyle.glow} inset` }}
          >
            {colorBlindMode ? <span className={styles.glyph}>{activeStyle.glyph}</span> : null}
          </div>
        ))}

        {!reducedEffects && <ParticleField ref={particleFieldRef} className={styles.effectsCanvas} />}

        {snapshot.phase === 'paused' && (
          <div className={styles.overlayMessage} aria-hidden="true">
            ⏸
          </div>
        )}
      </div>
    </div>
  );
}
