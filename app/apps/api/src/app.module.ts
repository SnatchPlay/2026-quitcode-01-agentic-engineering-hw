import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller.js';
import { LeaderboardController } from './leaderboard/leaderboard.controller.js';

@Module({
  imports: [],
  controllers: [HealthController, LeaderboardController],
  providers: [],
})
export class AppModule {}
