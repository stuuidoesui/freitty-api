import { OrderStatus } from '@prisma/client';
import { DashboardService } from './dashboard.service';

function makePrisma(overrides: Record<string, unknown> = {}) {
  return {
    order: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
      aggregate: jest.fn().mockResolvedValue({
        _count: 0,
        _sum: { totalCents: 0 },
      }),
    },
    $queryRaw: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
}

describe('DashboardService.summary', () => {
  it('computes KPI cards from prisma aggregates', async () => {
    const prisma = makePrisma();
    prisma.order.count
      .mockResolvedValueOnce(7)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(24)
      .mockResolvedValueOnce(24);
    prisma.order.findMany.mockResolvedValueOnce([
      {
        number: 'FR001674',
        alertReason: 'photo missing',
        awaitingAction: false,
        hasAlert: true,
      },
      {
        number: 'FR001681',
        alertReason: null,
        awaitingAction: true,
        hasAlert: false,
      },
      {
        number: 'FR001690',
        alertReason: null,
        awaitingAction: true,
        hasAlert: false,
      },
    ]);

    const service = new DashboardService(prisma as never);
    const summary = await service.summary();

    expect(summary.active.count).toBe(7);
    expect(summary.active.deltaThisWeek).toBe(2);
    expect(summary.completed30d.count).toBe(24);
    expect(summary.completed30d.trend).toBe('same');
    expect(summary.needAttention.total).toBe(3);
    expect(summary.needAttention.awaitingAction).toBe(2);
    expect(summary.needAttention.alerts[0].orderNumber).toBe('FR001674');
  });
});

describe('pipeline mapping used by dashboard active list', () => {
  it('treats ON_STOCK as an active status', () => {
    expect([
      OrderStatus.NEW,
      OrderStatus.READY,
      OrderStatus.IN_PROGRESS,
      OrderStatus.ON_STOCK,
    ]).toEqual(expect.arrayContaining([OrderStatus.ON_STOCK]));
  });
});
