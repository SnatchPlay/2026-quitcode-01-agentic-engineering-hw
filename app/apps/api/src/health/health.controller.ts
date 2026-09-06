import { Controller, Get } from '@nestjs/common';

interface HealthResponse {
  status: 'ok';
  service: '@tetris/api';
  timestamp: string;
}

/**
 * Liveness/readiness probe. Deliberately dependency-free (no DB/Redis check
 * yet) — this API is a Phase 0 scaffold; real health checks (Postgres, Redis,
 * BullMQ queue depth) land in Phase 4 alongside the leaderboard/run-verification
 * work described in the project plan.
 */
@Controller('health')
export class HealthController {
  @Get()
  check(): HealthResponse {
    return { status: 'ok', service: '@tetris/api', timestamp: new Date().toISOString() };
  }
}
