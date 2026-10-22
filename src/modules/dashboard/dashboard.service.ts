import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { now } from '../../common/clock';
import { PrismaService } from '../../prisma/prisma.service';
import { toOrderListItem } from '../orders/orders.mapper';
import { ACTIVE_STATUSES, COMPLETED_STATUSES } from '../orders/status.rules';

export type ActivityPeriod = 'day' | 'week' | 'month' | 'quarter';

type BucketRow = {
  bucket: Date;
  orders: number;
  spend: bigint | number;
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const current = now();
    const weekAgo = new Date(current);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const d30 = new Date(current);
    d30.setDate(d30.getDate() - 30);
    const d60 = new Date(current);
    d60.setDate(d60.getDate() - 60);

    const [active, activeThisWeek, completed30, completedPrev30, attention] =
      await Promise.all([
        this.prisma.order.count({ where: { status: { in: ACTIVE_STATUSES } } }),
        this.prisma.order.count({
          where: {
            status: { in: ACTIVE_STATUSES },
            createdAt: { gte: weekAgo },
          },
        }),
        this.prisma.order.count({
          where: {
            status: { in: COMPLETED_STATUSES },
            completedAt: { gte: d30 },
          },
        }),
        this.prisma.order.count({
          where: {
            status: { in: COMPLETED_STATUSES },
            completedAt: { gte: d60, lt: d30 },
          },
        }),
        this.prisma.order.findMany({
          where: { OR: [{ awaitingAction: true }, { hasAlert: true }] },
          select: {
            number: true,
            alertReason: true,
            awaitingAction: true,
            hasAlert: true,
          },
          orderBy: { scheduledAt: 'desc' },
        }),
      ]);

    const awaitingAction = attention.filter((o) => o.awaitingAction).length;
    const alertOrders = attention.filter((o) => o.hasAlert);

    let completedTrend: 'up' | 'down' | 'same' = 'same';
    if (completed30 > completedPrev30) completedTrend = 'up';
    if (completed30 < completedPrev30) completedTrend = 'down';

    return {
      active: {
        count: active,
        deltaThisWeek: activeThisWeek,
      },
      completed30d: {
        count: completed30,
        previousCount: completedPrev30,
        trend: completedTrend,
      },
      needAttention: {
        total: attention.length,
        awaitingAction,
        alerts: alertOrders.map((o) => ({
          orderNumber: o.number,
          reason: o.alertReason,
        })),
      },
    };
  }

  async activeOrders() {
    const rows = await this.prisma.order.findMany({
      where: { status: { in: ACTIVE_STATUSES } },
      include: {
        hub: { select: { name: true, region: true } },
        createdBy: {
          select: { code: true, name: true, role: true, avatarColor: true },
        },
        subOrders: {
          select: {
            number: true,
            refNumber: true,
            pallets: true,
            alert: true,
          },
          orderBy: { number: 'asc' },
        },
      },
      orderBy: [{ hasAlert: 'desc' }, { scheduledAt: 'desc' }],
      take: 8,
    });
    return rows.map(toOrderListItem);
  }

  async activity(period: ActivityPeriod = 'month') {
    const current = now();
    const unit =
      period === 'day'
        ? Prisma.raw(`'day'`)
        : period === 'quarter'
          ? Prisma.raw(`'quarter'`)
          : Prisma.raw(`'week'`);

    const from = new Date(current);
    if (period === 'day') from.setDate(from.getDate() - 14);
    else if (period === 'quarter') from.setMonth(from.getMonth() - 12);
    else from.setDate(from.getDate() - 12 * 7);

    const rows = await this.prisma.$queryRaw<BucketRow[]>`
      SELECT date_trunc(${unit}, "completedAt") AS bucket,
             COUNT(*)::int AS orders,
             COALESCE(SUM("totalCents"), 0)::bigint AS spend
      FROM "Order"
      WHERE "completedAt" IS NOT NULL
        AND "completedAt" >= ${from}
        AND status IN ('COMPLETED', 'CLOSED')
      GROUP BY 1
      ORDER BY 1
    `;

    const completedSeries = rows.map((r, i) => ({
      label: this.labelFor(period, r.bucket, i),
      value: Number(r.orders),
      date: r.bucket.toISOString(),
    }));
    const spendSeries = rows.map((r, i) => ({
      label: this.labelFor(period, r.bucket, i),
      valueCents: Number(r.spend),
      date: r.bucket.toISOString(),
    }));

    const completedTotal = completedSeries.reduce((s, x) => s + x.value, 0);
    const spendTotal = spendSeries.reduce((s, x) => s + x.valueCents, 0);

    const d30 = new Date(current);
    d30.setDate(d30.getDate() - 30);
    const d60 = new Date(current);
    d60.setDate(d60.getDate() - 60);

    const [last30, prev30] = await Promise.all([
      this.prisma.order.aggregate({
        where: {
          status: { in: COMPLETED_STATUSES },
          completedAt: { gte: d30 },
        },
        _count: true,
        _sum: { totalCents: true },
      }),
      this.prisma.order.aggregate({
        where: {
          status: { in: COMPLETED_STATUSES },
          completedAt: { gte: d60, lt: d30 },
        },
        _count: true,
        _sum: { totalCents: true },
      }),
    ]);

    const completedChangePct =
      prev30._count === 0
        ? last30._count > 0
          ? 100
          : 0
        : Math.round(((last30._count - prev30._count) / prev30._count) * 100);

    let best = spendSeries[0];
    for (const p of spendSeries) {
      if (!best || p.valueCents > best.valueCents) best = p;
    }

    const avgCents =
      last30._count > 0
        ? Math.round((last30._sum.totalCents ?? 0) / last30._count)
        : 0;

    return {
      period,
      completed: {
        total: last30._count,
        series: completedSeries,
      },
      spend: {
        totalCents: last30._sum.totalCents ?? 0,
        series: spendSeries,
      },
      insights: {
        completedChangePct,
        spentCents: last30._sum.totalCents ?? 0,
        avgCents,
        bestWeekLabel: best?.label ?? null,
        bestWeekSpendCents: best?.valueCents ?? 0,
        seriesTotals: { completedTotal, spendTotal },
      },
    };
  }

  private labelFor(period: ActivityPeriod, date: Date, index: number): string {
    if (period === 'day') {
      return date.toLocaleDateString('en-CA', {
        month: 'short',
        day: 'numeric',
      });
    }
    if (period === 'quarter') {
      const q = Math.floor(date.getMonth() / 3) + 1;
      return `Q${q} ${date.getFullYear()}`;
    }
    if (period === 'month') {
      return `W${index + 1}`;
    }
    return `W${index + 1}`;
  }
}
