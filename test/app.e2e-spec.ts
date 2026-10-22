import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus, PrismaClient } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Freitty API (e2e)', () => {
  let app: INestApplication<App>;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();
    await prisma.order.update({
      where: { number: 'DRAFT-003' },
      data: { status: OrderStatus.DRAFT, statusLabel: 'Draft' },
    });
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('GET /api/health', async () => {
    const res = await request(app.getHttpServer()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/me returns demo User 1', async () => {
    const res = await request(app.getHttpServer()).get('/api/me');
    expect(res.status).toBe(200);
    expect(res.body.code).toBe('U1');
    expect(res.body.account.balanceCents).toBeGreaterThan(0);
  });

  it('GET /api/orders returns a paginated list', async () => {
    const res = await request(app.getHttpServer()).get('/api/orders?limit=6');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.total).toBeGreaterThanOrEqual(res.body.items.length);
  });

  it('GET /api/orders/counts', async () => {
    const res = await request(app.getHttpServer()).get('/api/orders/counts');
    expect(res.status).toBe(200);
    expect(res.body.all).toBeGreaterThan(0);
    expect(res.body.drafts).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/orders/FR001383 returns detail with operations', async () => {
    const res = await request(app.getHttpServer()).get('/api/orders/FR001383');
    expect(res.status).toBe(200);
    expect(res.body.number).toBe('FR001383');
    expect(res.body.operations.length).toBe(4);
    expect(res.body.supplies.length).toBe(3);
    expect(res.body.dock.dockNumber).toBe(12);
  });

  it('GET /api/dashboard/summary', async () => {
    const res = await request(app.getHttpServer()).get(
      '/api/dashboard/summary',
    );
    expect(res.status).toBe(200);
    expect(res.body.active.count).toBeGreaterThan(0);
    expect(res.body.needAttention.total).toBeGreaterThan(0);
  });

  it('PATCH /api/orders/:number/status forbids illegal client move', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/orders/FR001681/status')
      .send({ status: OrderStatus.IN_PROGRESS });
    expect(res.status).toBe(403);
  });

  it('PATCH /api/orders/DRAFT-003/status allows Draft → Ready', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/orders/DRAFT-003/status')
      .send({ status: OrderStatus.READY });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(OrderStatus.READY);

    await request(app.getHttpServer())
      .patch('/api/orders/DRAFT-003/status')
      .send({ status: OrderStatus.DRAFT })
      .expect(403);
  });
});
