'use client';

import type { DifficultyPresetName, GameConfig, GameMode } from '@tetris/engine';
import { DIFFICULTY_PRESETS } from '@tetris/engine';
import { useMemo, useState } from 'react';
import {
  PButton,
  PHeading,
  PSegmentedControl,
  PSegmentedControlItem,
  PTable,
  PTableBody,
  PTableCell,
  PTableHead,
  PTableHeadCell,
  PTableHeadRow,
  PTableRow,
  PText,
} from '@/pds';
import { getHighScores } from '@/game/localHighScores';

interface StartScreenProps {
  onStart: (config: GameConfig) => void;
}

const MODE_LABEL: Record<Extract<GameMode, 'marathon' | 'sprint'>, string> = {
  marathon: 'Марафон',
  sprint: 'Спринт (40 ліній)',
};

const PRESET_LABEL: Record<Exclude<DifficultyPresetName, 'custom'>, string> = {
  chill: 'Спокійно',
  classic: 'Класика',
  expert: 'Експерт',
  insane: 'Шалено',
};

function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

export function StartScreen({ onStart }: StartScreenProps) {
  const [mode, setMode] = useState<Extract<GameMode, 'marathon' | 'sprint'>>('marathon');
  const [presetName, setPresetName] = useState<Exclude<DifficultyPresetName, 'custom'>>('classic');

  const highScores = useMemo(() => getHighScores(mode, presetName), [mode, presetName]);
  const isSprint = mode === 'sprint';

  const handleStart = () => {
    const preset = DIFFICULTY_PRESETS[presetName];
    const config: GameConfig = {
      mode,
      preset,
      seed: randomSeed(),
      lineTarget: isSprint ? 40 : 0,
      timeLimitMs: 0,
    };
    onStart(config);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 420, margin: '0 auto', padding: 24 }}>
      <div>
        <PHeading size="2xl" tag="h1">
          PDS Tetris
        </PHeading>
        <PText size="sm" color="contrast-medium">
          Сучасний Tetris на Porsche Design System.
        </PText>
      </div>

      <PSegmentedControl
        value={mode}
        onChange={(e) => setMode(e.detail.value as Extract<GameMode, 'marathon' | 'sprint'>)}
      >
        {(Object.keys(MODE_LABEL) as (keyof typeof MODE_LABEL)[]).map((m) => (
          <PSegmentedControlItem key={m} value={m}>
            {MODE_LABEL[m]}
          </PSegmentedControlItem>
        ))}
      </PSegmentedControl>

      <PSegmentedControl
        value={presetName}
        onChange={(e) => setPresetName(e.detail.value as Exclude<DifficultyPresetName, 'custom'>)}
      >
        {(Object.keys(PRESET_LABEL) as (keyof typeof PRESET_LABEL)[]).map((p) => (
          <PSegmentedControlItem key={p} value={p}>
            {PRESET_LABEL[p]}
          </PSegmentedControlItem>
        ))}
      </PSegmentedControl>

      <PButton type="button" variant="primary" icon="play-filled" onClick={handleStart}>
        Почати гру
      </PButton>

      <div>
        <PHeading size="sm" tag="h2">
          Локальні рекорди — {MODE_LABEL[mode]} / {PRESET_LABEL[presetName]}
        </PHeading>
        {highScores.length === 0 ? (
          <PText size="sm" color="contrast-medium">
            Ще немає результатів для цього режиму.
          </PText>
        ) : (
          <PTable caption="Локальні рекорди">
            <PTableHead>
              <PTableHeadRow>
                <PTableHeadCell>#</PTableHeadCell>
                <PTableHeadCell>{isSprint ? 'Час' : 'Рахунок'}</PTableHeadCell>
                <PTableHeadCell>Лінії</PTableHeadCell>
              </PTableHeadRow>
            </PTableHead>
            <PTableBody>
              {highScores.slice(0, 5).map((entry, i) => (
                <PTableRow key={i}>
                  <PTableCell>{i + 1}</PTableCell>
                  <PTableCell>
                    {isSprint ? `${(entry.durationMs / 1000).toFixed(2)} с` : entry.score.toLocaleString('uk-UA')}
                  </PTableCell>
                  <PTableCell>{entry.lines}</PTableCell>
                </PTableRow>
              ))}
            </PTableBody>
          </PTable>
        )}
      </div>
    </div>
  );
}
