'use client';

import type { GameConfig } from '@tetris/engine';
import { PButton, PDivider, PTag, PText } from '@/pds';
import type { GameSnapshot } from '@/game/useGameLoop';
import { PiecePreview } from './PiecePreview';
import styles from './Hud.module.css';

interface HudProps {
  snapshot: GameSnapshot;
  config: GameConfig;
  onPause: () => void;
  onOpenSettings: () => void;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function Hud({ snapshot, config, onPause, onOpenSettings }: HudProps) {
  const linesLabel =
    config.lineTarget > 0 ? `${snapshot.lines} / ${config.lineTarget}` : String(snapshot.lines);

  return (
    <div className={styles.hud}>
      <section className={styles.section}>
        <PText size="xs" color="contrast-medium">
          Рахунок
        </PText>
        <PText size="2xl" weight="bold">
          {snapshot.score.toLocaleString('uk-UA')}
        </PText>
      </section>

      <div className={styles.badgeRow}>
        {snapshot.combo > 0 && <PTag variant="warning-frosted">Комбо ×{snapshot.combo}</PTag>}
        {snapshot.backToBack && <PTag variant="success-frosted">Back-to-Back</PTag>}
      </div>

      <PDivider />

      <section className={styles.statsGrid}>
        <div>
          <PText size="xs" color="contrast-medium">
            Рівень
          </PText>
          <PText size="lg" weight="semibold">
            {snapshot.level}
          </PText>
        </div>
        <div>
          <PText size="xs" color="contrast-medium">
            Лінії
          </PText>
          <PText size="lg" weight="semibold">
            {linesLabel}
          </PText>
        </div>
        {snapshot.timeRemainingMs !== null && (
          <div>
            <PText size="xs" color="contrast-medium">
              Час
            </PText>
            <PText size="lg" weight="semibold">
              {formatTime(snapshot.timeRemainingMs)}
            </PText>
          </div>
        )}
      </section>

      <PDivider />

      <section className={styles.section}>
        <PText size="xs" color="contrast-medium">
          Утримання
        </PText>
        <PiecePreview type={snapshot.holdPiece} dim={snapshot.holdUsedThisPiece} />
      </section>

      <section className={styles.section}>
        <PText size="xs" color="contrast-medium">
          Далі
        </PText>
        <div className={styles.nextQueue}>
          {snapshot.nextQueue.slice(0, config.preset.nextQueueSize).map((piece, i) => (
            <PiecePreview key={i} type={piece} size={i === 0 ? 16 : 12} />
          ))}
        </div>
      </section>

      <div className={styles.actions}>
        <PButton type="button" variant="secondary" icon="pause" onClick={onPause} disabled={snapshot.phase !== 'playing'}>
          Пауза
        </PButton>
        <PButton type="button" variant="secondary" icon="wrench" onClick={onOpenSettings}>
          Налаштування
        </PButton>
      </div>
    </div>
  );
}
