import { Test, type TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get(HealthController);
  });

  it('reports ok status for this service', () => {
    const result = controller.check();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('@tetris/api');
    expect(() => new Date(result.timestamp)).not.toThrow();
  });
});
