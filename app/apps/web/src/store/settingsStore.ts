'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface KeyBindings {
  moveLeft: string;
  moveRight: string;
  softDrop: string;
  hardDrop: string;
  rotateCw: string;
  rotateCcw: string;
  rotate180: string;
  hold: string;
  pause: string;
}

export const DEFAULT_KEYBINDINGS: KeyBindings = {
  moveLeft: 'ArrowLeft',
  moveRight: 'ArrowRight',
  softDrop: 'ArrowDown',
  hardDrop: 'Space',
  rotateCw: 'ArrowUp',
  rotateCcw: 'KeyZ',
  rotate180: 'KeyA',
  hold: 'KeyC',
  pause: 'Escape',
};

interface SettingsState {
  /** Delayed Auto Shift, ms before repeat kicks in. */
  das: number;
  /** Auto Repeat Rate, ms between repeats once DAS has elapsed (0 = instant). */
  arr: number;
  keyBindings: KeyBindings;
  reducedEffects: boolean;
  colorBlindMode: boolean;
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  setDas: (ms: number) => void;
  setArr: (ms: number) => void;
  setKeyBinding: (action: keyof KeyBindings, code: string) => void;
  resetKeyBindings: () => void;
  setReducedEffects: (value: boolean) => void;
  setColorBlindMode: (value: boolean) => void;
  setMasterVolume: (value: number) => void;
  setSfxVolume: (value: number) => void;
  setMusicVolume: (value: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      das: 133,
      arr: 0,
      keyBindings: DEFAULT_KEYBINDINGS,
      reducedEffects: false,
      colorBlindMode: false,
      masterVolume: 0.8,
      sfxVolume: 0.8,
      musicVolume: 0.5,
      setDas: (ms) => set({ das: Math.max(0, Math.min(300, ms)) }),
      setArr: (ms) => set({ arr: Math.max(0, Math.min(100, ms)) }),
      setKeyBinding: (action, code) => set((s) => ({ keyBindings: { ...s.keyBindings, [action]: code } })),
      resetKeyBindings: () => set({ keyBindings: DEFAULT_KEYBINDINGS }),
      setReducedEffects: (value) => set({ reducedEffects: value }),
      setColorBlindMode: (value) => set({ colorBlindMode: value }),
      setMasterVolume: (value) => set({ masterVolume: value }),
      setSfxVolume: (value) => set({ sfxVolume: value }),
      setMusicVolume: (value) => set({ musicVolume: value }),
    }),
    { name: 'tetris-pds:settings:v1' },
  ),
);
