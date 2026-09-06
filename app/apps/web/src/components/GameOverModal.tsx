'use client';

import { PButton, PHeading, PModal, PTag, PText } from '@/pds';
import type { GameSnapshot } from '@/game/useGameLoop';

interface GameOverModalProps {
  open: boolean;
  snapshot: GameSnapshot;
  isNewHighScore: boolean;
  onRestart: () => void;
  onExitToMenu: () => void;
}

const REASON_LABEL: Record<string, string> = {
  'block-out': 'Нова фігура не змогла з’явитися — стакан переповнено.',
  'lock-out': 'Фігура зафіксувалась повністю поза видимим полем.',
  'top-out': 'Стакан заповнено.',
};

export function GameOverModal({ open, snapshot, isNewHighScore, onRestart, onExitToMenu }: GameOverModalProps) {
  const finished = snapshot.phase === 'finished';
  return (
    <PModal open={open} dismissButton={false}>
      <PHeading slot="header" size="lg" tag="h2">
        {finished ? 'Забіг завершено' : 'Гру закінчено'}
      </PHeading>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 280, textAlign: 'center' }}>
        {isNewHighScore && <PTag variant="success-frosted">Новий локальний рекорд!</PTag>}
        {!finished && snapshot.gameOverReason && (
          <PText size="sm" color="contrast-medium">
            {REASON_LABEL[snapshot.gameOverReason] ?? ''}
          </PText>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, textAlign: 'left' }}>
          <div>
            <PText size="xs" color="contrast-medium">
              Рахунок
            </PText>
            <PText size="lg" weight="semibold">
              {snapshot.score.toLocaleString('uk-UA')}
            </PText>
          </div>
          <div>
            <PText size="xs" color="contrast-medium">
              Лінії
            </PText>
            <PText size="lg" weight="semibold">
              {snapshot.lines}
            </PText>
          </div>
          <div>
            <PText size="xs" color="contrast-medium">
              Рівень
            </PText>
            <PText size="lg" weight="semibold">
              {snapshot.level}
            </PText>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <PButton type="button" variant="primary" icon="replay" onClick={onRestart}>
            Ще раз
          </PButton>
          <PButton type="button" variant="secondary" icon="menu-lines" onClick={onExitToMenu}>
            У меню
          </PButton>
        </div>
      </div>
    </PModal>
  );
}
