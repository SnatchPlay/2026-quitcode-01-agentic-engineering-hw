import { Controller, Get, Param } from '@nestjs/common';

interface LeaderboardEntryStub {
  rank: number;
  playerName: string;
  score: number;
}

/**
 * Placeholder only — returns an empty board for every mode/preset.
 *
 * The real implementation (Phase 4 of the project plan) reads from a Redis
 * sorted set per (mode, preset, period) and only ever ranks runs whose
 * `RunsModule` verification worker re-derived the *exact same* result by
 * replaying the client's input log through `@tetris/engine`'s `replay()` —
 * this endpoint existing today is just so the route shape (and the web
 * app's future fetch call) can be agreed on before that lands.
 */
@Controller('leaderboard')
export class LeaderboardController {
  @Get(':mode/:preset')
  getBoard(@Param('mode') _mode: string, @Param('preset') _preset: string): LeaderboardEntryStub[] {
    return [];
  }
}
