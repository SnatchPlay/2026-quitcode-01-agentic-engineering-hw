'use client';

import type { LineClearEvent } from '@tetris/engine';
import { BOARD_BUFFER_HEIGHT, BOARD_WIDTH } from '@tetris/engine';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export interface ParticleFieldHandle {
  burst: (event: LineClearEvent) => void;
}

interface ParticleFieldProps {
  className?: string;
}

const GRAVITY = 900; // px/s^2
const BIG_EVENT_KINDS = new Set<LineClearEvent['kind']>(['tetris', 'tspin-single', 'tspin-double', 'tspin-triple']);

/**
 * A lightweight, allocation-conscious particle system for line-clear/perfect-clear
 * bursts. Runs on a plain 2D canvas laid over the DOM board (not the board's
 * renderer itself) — exactly the "canvas overlay for effects only" split described
 * in the plan, so this can be dropped entirely (see Board.tsx's `reducedEffects`
 * gate) without touching gameplay rendering at all.
 */
export const ParticleField = forwardRef<ParticleFieldHandle, ParticleFieldProps>(function ParticleField(
  { className },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const dprRef = useRef(1);

  useImperativeHandle(ref, () => ({
    burst(event: LineClearEvent) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const width = canvas.width / dprRef.current;
      const cellPx = width / BOARD_WIDTH;
      const big = BIG_EVENT_KINDS.has(event.kind);
      const accent = event.perfectClear ? '#ffffff' : big ? '#ffd76a' : '#ffffff';

      for (const row of event.rows) {
        const visibleRow = row - BOARD_BUFFER_HEIGHT;
        const y = (visibleRow + 0.5) * cellPx;
        const count = big ? 26 : 14;
        for (let i = 0; i < count; i++) {
          particlesRef.current.push({
            x: Math.random() * width,
            y,
            vx: (Math.random() - 0.5) * (big ? 260 : 160),
            vy: -Math.random() * (big ? 260 : 160),
            life: 0,
            maxLife: 0.4 + Math.random() * 0.35,
            size: big ? 2 + Math.random() * 3 : 1.5 + Math.random() * 2,
            color: accent,
          });
        }
      }

      if (event.perfectClear) {
        const height = canvas.height / dprRef.current;
        for (let i = 0; i < 60; i++) {
          const angle = (i / 60) * Math.PI * 2;
          particlesRef.current.push({
            x: width / 2,
            y: height / 2,
            vx: Math.cos(angle) * 240,
            vy: Math.sin(angle) * 240,
            life: 0,
            maxLife: 0.6,
            size: 3,
            color: '#ffffff',
          });
        }
      }
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      dprRef.current = dpr;
      canvas.width = parent.clientWidth * dpr;
      canvas.height = parent.clientHeight * dpr;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(parent);

    const ctx = canvas.getContext('2d');
    let raf = 0;
    let lastTime: number | null = null;

    const frame = (time: number) => {
      raf = requestAnimationFrame(frame);
      if (lastTime === null) {
        lastTime = time;
        return;
      }
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;
      if (!ctx) return;

      const dpr = dprRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      const alive: Particle[] = [];
      for (const p of particlesRef.current) {
        p.life += dt;
        if (p.life >= p.maxLife) continue;
        p.vy += GRAVITY * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const alpha = 1 - p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        alive.push(p);
      }
      ctx.globalAlpha = 1;
      particlesRef.current = alive;
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
});
