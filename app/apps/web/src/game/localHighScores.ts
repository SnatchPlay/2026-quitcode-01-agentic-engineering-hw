'use client';

import { localHighScoreSchema, type LocalHighScoreDto } from '@tetris/contracts';
import { z } from 'zod';
import type { GameMode, DifficultyPresetName } from '@tetris/engine';

const STORAGE_KEY = 'tetris-pds:high-scores:v1';
const MAX_ENTRIES_PER_KEY = 10;

const storeSchema = z.record(z.string(), z.array(localHighScoreSchema));
type Store = z.infer<typeof storeSchema>;

function keyFor(mode: GameMode, preset: DifficultyPresetName): string {
  return `${mode}:${preset}`;
}

function readStore(): Store {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = storeSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : {};
  } catch {
    // Corrupt or inaccessible storage shouldn't crash the game — just start fresh.
    return {};
  }
}

function writeStore(store: Store): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage full / private-mode: silently drop, high scores just won't persist this session.
  }
}

export function getHighScores(mode: GameMode, preset: DifficultyPresetName): LocalHighScoreDto[] {
  const store = readStore();
  return store[keyFor(mode, preset)] ?? [];
}

/** Returns true if this run made it onto its mode+preset's local top-10 board. */
export function submitLocalRun(entry: LocalHighScoreDto): boolean {
  const store = readStore();
  const key = keyFor(entry.mode, entry.preset);
  const existing = store[key] ?? [];
  const isSprint = entry.mode === 'sprint';
  // Sprint ranks by fastest time; every other mode ranks by highest score.
  const sorted = [...existing, entry].sort((a, b) => (isSprint ? a.durationMs - b.durationMs : b.score - a.score));
  const trimmed = sorted.slice(0, MAX_ENTRIES_PER_KEY);
  store[key] = trimmed;
  writeStore(store);
  return trimmed.includes(entry);
}

export function clearAllLocalScores(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}
