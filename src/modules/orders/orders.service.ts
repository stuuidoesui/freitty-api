import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { now } from '../../common/clock';
import { PrismaService } from '../../prisma/prisma.service';
import { DateRange, ListOrdersDto, OrderTab } from './dto/list-orders.dto';
import { toOrderDetail, toOrderListItem } from './orders.mapper';
import { assertClientStatusTransition, statusLabelFor } from './status.rules';

const listInclude = {
  hub: { select: { name: true, region: true } },
  createdBy: {
    select: { code: true, name: true, role: true, avatarColor: true },
  },
  subOrders: {
    select: { number: true, refNumber: true, pallets: true, alert: true },
    orderBy: { number: 'asc' as const },
  },
};

const detailInclude = {
  ...listInclude,
  cargoLines: true,
  dock: {
    include: {
      assignedTo: { select: { code: true, name: true, role: true } },
    },
  },
  operations: { orderBy: { appliedAt: 'asc' as const } },
  supplies: true,
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private dateFilter(range?: DateRange): Prisma.DateTimeFilter | undefined {
    const current = now();
    if (range === DateRange.TODAY) {
      const start = new Date(current);
      start.setHours(0, 0, 0, 0);
      return { gte: start };
    }
    if (range === DateRange.THIS_WEEK) {
      const start = new Date(current);
      const day = start.getDay();
      start.setDate(start.getDate() - ((day + 6) % 7));
      start.setHours(0, 0, 0, 0);
      return { gte: start };
    }
    if (range === DateRange.LAST_30) {
      const start = new Date(current);
      start.setDate(start.getDate() - 30);
      return { gte: start };
    }
    return undefined;
  }

  private whereFromQuery(query: ListOrdersDto): Prisma.OrderWhereInput {
    const where: Prisma.OrderWhereInput = {};

    if (query.tab === OrderTab.CROSS_DOCK) {
      where.type = 'CROSS_DOCK';
      where.status = { not: OrderStatus.DRAFT };
    } else if (query.tab === OrderTab.CONSOLIDATION) {
      where.type = 'CONSOLIDATION';
      where.status = { not: OrderStatus.DRAFT };
    } else if (query.tab === OrderTab.ALERTS) {
      where.hasAlert = true;
    } else if (query.tab === OrderTab.DRAFTS) {
      where.status = OrderStatus.DRAFT;
    }

    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.hub && query.hub !== 'all') {
      where.hub = { name: { equals: query.hub, mode: 'insensitive' } };
    }

    const scheduled = this.dateFilter(query.dateRange);
    if (scheduled) where.scheduledAt = scheduled;

    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { number: { contains: q, mode: 'insensitive' } },
        { refNumber: { contains: q, mode: 'insensitive' } },
        { carrier: { contains: q, mode: 'insensitive' } },
        { destination: { contains: q, mode: 'insensitive' } },
        { customer: { contains: q, mode: 'insensitive' } },
        { invoiceNumber: { contains: q, mode: 'insensitive' } },
        {
          subOrders: {
            some: {
              OR: [
                { number: { contains: q, mode: 'insensitive' } },
                { refNumber: { contains: q, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    return where;
  }

  async list(query: ListOrdersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const where = this.whereFromQuery(query);

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: listInclude,
        orderBy: [{ scheduledAt: 'desc' }, { number: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      items: rows.map(toOrderListItem),
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async counts() {
    const [all, crossDock, consolidation, alerts, drafts] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({
        where: { type: 'CROSS_DOCK', status: { not: OrderStatus.DRAFT } },
      }),
      this.prisma.order.count({
        where: { type: 'CONSOLIDATION', status: { not: OrderStatus.DRAFT } },
      }),
      this.prisma.order.count({ where: { hasAlert: true } }),
      this.prisma.order.count({ where: { status: OrderStatus.DRAFT } }),
    ]);

    return { all, crossDock, consolidation, alerts, drafts };
  }

  async findByNumber(number: string) {
    const order = await this.prisma.order.findUnique({
      where: { number },
      include: detailInclude,
    });
    if (!order) {
      throw new NotFoundException(`Order ${number} not found`);
    }
    return toOrderDetail(order);
  }

  async exportCsv(query: ListOrdersDto): Promise<string> {
    const where = this.whereFromQuery(query);
    const rows = await this.prisma.order.findMany({
      where,
      include: listInclude,
      orderBy: [{ scheduledAt: 'desc' }, { number: 'desc' }],
    });

    const header = [
      'number',
      'type',
      'status',
      'hub',
      'scheduledAt',
      'carrier',
      'destination',
      'qty',
      'refNumbers',
      'createdBy',
      'totalCents',
    ];

    const lines = rows.map((o) => {
      const refs = [o.refNumber, ...o.subOrders.map((s) => s.refNumber)]
        .filter(Boolean)
        .join('|');
      const cells = [
        o.number,
        o.type,
        o.status,
        o.hub.name,
        o.scheduledAt?.toISOString() ?? '',
        o.carrier ?? '',
        o.destination ?? '',
        o.qtyLabel ?? '',
        refs,
        o.createdBy.name,
        String(o.totalCents),
      ].map((c) => `"${String(c).replace(/"/g, '""')}"`);
      return cells.join(',');
    });

    return [header.join(','), ...lines].join('\n');
  }

  async updateStatus(number: string, next: OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { number } });
    if (!order) {
      throw new NotFoundException(`Order ${number} not found`);
    }
    assertClientStatusTransition(order.status, next);

    const updated = await this.prisma.order.update({
      where: { number },
      data: {
        status: next,
        statusLabel: statusLabelFor(next, order.hasAlert),
        nextStep:
          next === OrderStatus.READY ? 'Waiting for warehouse' : order.nextStep,
      },
      include: detailInclude,
    });

    return toOrderDetail(updated);
  }
}
