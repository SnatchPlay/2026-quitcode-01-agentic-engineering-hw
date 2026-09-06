'use client';

import { PButton, PHeading, PModal } from '@/pds';

interface PauseModalProps {
  open: boolean;
  onResume: () => void;
  onRestart: () => void;
  onExitToMenu: () => void;
  onOpenSettings: () => void;
}

export function PauseModal({ open, onResume, onRestart, onExitToMenu, onOpenSettings }: PauseModalProps) {
  return (
    // Dismissing the modal (Escape / backdrop click) is treated as "resume" — the only
    // sensible meaning of closing a *pause* dialog without picking another action.
    <PModal open={open} onDismiss={onResume}>
      <PHeading slot="header" size="lg" tag="h2">
        Пауза
      </PHeading>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 240, textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <PButton type="button" variant="primary" icon="play" onClick={onResume}>
            Продовжити
          </PButton>
          <PButton type="button" variant="secondary" icon="wrench" onClick={onOpenSettings}>
            Налаштування
          </PButton>
          <PButton type="button" variant="secondary" icon="replay" onClick={onRestart}>
            Почати заново
          </PButton>
          <PButton type="button" variant="secondary" icon="menu-lines" onClick={onExitToMenu}>
            У меню
          </PButton>
        </div>
      </div>
    </PModal>
  );
}
