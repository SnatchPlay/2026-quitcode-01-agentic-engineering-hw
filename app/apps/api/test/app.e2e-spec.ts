import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';

// NOTE: the CLI-generated spec imports `App` from 'supertest/types', but neither
// `supertest` nor `@types/supertest` declare that subpath in an exports map or
// typesVersions redirect, so `tsc` can't resolve it under nodenext resolution
// (vitest's esbuild transform doesn't type-check, so this only breaks `tsc --noEmit`,
// not `nest build` or the actual test run). Omitting the generic type parameter
// avoids the broken import; `INestApplication` still works fine untyped-generic.
describe('AppModule (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('ok');
      });
  });

  it('/leaderboard/:mode/:preset (GET) returns an empty stub board', () => {
    return request(app.getHttpServer()).get('/leaderboard/marathon/classic').expect(200).expect([]);
  });

  afterEach(async () => {
    await app.close();
  });
});
