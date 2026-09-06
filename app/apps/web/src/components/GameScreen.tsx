'use client';

import type { GameConfig } from '@tetris/engine';
import { useEffect, useRef, useState } from 'react';
import { useGameLoop } from '@/game/useGameLoop';
import { submitLocalRun } from '@/game/localHighScores';
import { Board } from './Board';
import { Hud } from './Hud';
import { GameOverModal } from './GameOverModal';
import { PauseModal } from './PauseModal';
import { SettingsFlyout } from './SettingsFlyout';

interface GameScreenProps {
  config: GameConfig;
  onExitToMenu: () => void;
}

export function GameScreen({ config, onExitToMenu }: GameScreenProps) {
  const loop = useGameLoop(config);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const submittedRef = useRef(false);

  const { snapshot } = loop;
  const isGameOver = snapshot.phase === 'topped-out' || snapshot.phase === 'finished';

  useEffect(() => {
    if (!isGameOver || submittedRef.current) return;
    submittedRef.current = true;
    const madeHighScore = submitLocalRun({
      score: snapshot.score,
      lines: snapshot.lines,
      level: snapshot.level,
      durationMs: snapshot.frame * (1000 / 60),
      mode: config.mode,
      preset: config.preset.name,
      achievedAt: new Date().toISOString(),
    });
    setIsNewHighScore(madeHighScore);
  }, [isGameOver, snapshot, config]);

  const handleRestart = () => {
    submittedRef.current = false;
    setIsNewHighScore(false);
    const seed = Math.floor(Math.random() * 2 ** 31);
    loop.restart({ ...config, seed });
  };

  return (
    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'flex-start', padding: 16 }}>
      <Board getLiveState={loop.getLiveState} subscribeEvents={loop.subscribeEvents} snapshot={snapshot} />
      <Hud snapshot={snapshot} config={config} onPause={loop.pause} onOpenSettings={() => setSettingsOpen(true)} />

      <PauseModal
        open={snapshot.phase === 'paused' && !settingsOpen}
        onResume={loop.resume}
        onRestart={handleRestart}
        onExitToMenu={onExitToMenu}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <GameOverModal
        open={isGameOver}
        snapshot={snapshot}
        isNewHighScore={isNewHighScore}
        onRestart={handleRestart}
        onExitToMenu={onExitToMenu}
      />
      <SettingsFlyout open={settingsOpen} onDismiss={() => setSettingsOpen(false)} />
    </div>
  );
}
