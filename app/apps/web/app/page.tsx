'use client';

import type { GameConfig } from '@tetris/engine';
import { useState } from 'react';
import { GameScreen } from '@/components/GameScreen';
import { StartScreen } from '@/components/StartScreen';

export default function HomePage() {
  const [activeConfig, setActiveConfig] = useState<GameConfig | null>(null);

  if (activeConfig) {
    return <GameScreen config={activeConfig} onExitToMenu={() => setActiveConfig(null)} />;
  }
  return <StartScreen onStart={setActiveConfig} />;
}
