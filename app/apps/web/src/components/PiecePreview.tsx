'use client';

import { getCells } from '@tetris/engine';
import type { TetrominoType } from '@tetris/engine';
import { PIECE_STYLE } from '@/game/pieceStyles';
import { useSettingsStore } from '@/store/settingsStore';

interface PiecePreviewProps {
  type: TetrominoType | null;
  size?: number;
  dim?: boolean;
}

/** Renders a tetromino's spawn shape inside a fixed 4x2 box, used for the hold slot and next queue. */
export function PiecePreview({ type, size = 18, dim = false }: PiecePreviewProps) {
  const colorBlindMode = useSettingsStore((s) => s.colorBlindMode);
  const cells = type ? getCells(type, 'SPAWN') : [];
  const style = type ? PIECE_STYLE[type] : null;

  return (
    <div
      style={{
        position: 'relative',
        width: size * 4,
        height: size * 2,
        opacity: dim ? 0.35 : 1,
      }}
      aria-hidden="true"
    >
      {cells.map((cell, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: cell.x * size,
            top: cell.y * size,
            width: size,
            height: size,
            margin: 1,
            borderRadius: 2,
            background: style?.color,
            boxShadow: style ? `0 0 4px ${style.glow} inset` : undefined,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size * 0.42,
            fontWeight: 700,
            color: 'rgba(0,0,0,0.55)',
          }}
        >
          {colorBlindMode && style ? style.glyph : null}
        </div>
      ))}
    </div>
  );
}
