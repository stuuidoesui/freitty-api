import {
  CargoUnit,
  OperationType,
  OrderStatus,
  OrderType,
  PrismaClient,
  UserRole,
} from '@prisma/client';

const prisma = new PrismaClient();

const at = (iso: string) => new Date(iso);

async function main() {
  await prisma.supply.deleteMany();
  await prisma.operation.deleteMany();
  await prisma.dockAssignment.deleteMany();
  await prisma.cargoLine.deleteMany();
  await prisma.subOrder.deleteMany();
  await prisma.order.deleteMany();
  await prisma.user.deleteMany();
  await prisma.hub.deleteMany();
  await prisma.account.deleteMany();

  const account = await prisma.account.create({
    data: { company: 'R-way Transport', balance: 245_000 },
  });

  const [markham, toronto] = await Promise.all([
    prisma.hub.create({ data: { name: 'Markham', region: 'ON' } }),
    prisma.hub.create({ data: { name: 'Toronto', region: 'ON' } }),
  ]);

  const users = await Promise.all(
    [
      { code: 'U1', name: 'User 1', role: UserRole.ADMIN, avatarColor: '#5B21B6' },
      {
        code: 'U2',
        name: 'User 2',
        role: UserRole.DISPATCHER,
        avatarColor: '#0EA5E9',
      },
      {
        code: 'U3',
        name: 'User 3',
        role: UserRole.DISPATCHER,
        avatarColor: '#16A34A',
      },
      {
        code: 'U4',
        name: 'User 4',
        role: UserRole.DISPATCHER,
        avatarColor: '#D97706',
      },
      { code: 'U5', name: 'User 5', role: UserRole.DRIVER, avatarColor: '#DC2626' },
      {
        code: 'U6',
        name: 'User 6',
        role: UserRole.FLOOR_LEAD,
        avatarColor: '#ED1C2E',
      },
    ].map((u) => prisma.user.create({ data: { ...u, accountId: account.id } })),
  );

  const byCode = Object.fromEntries(users.map((u) => [u.code, u]));

  const featured = [
    prisma.order.create({
      data: {
        number: 'FR001676',
        type: OrderType.CONSOLIDATION,
        service: null,
        status: OrderStatus.IN_PROGRESS,
        statusLabel: 'In progress',
        scheduledAt: at('2026-04-12T09:00:00.000Z'),
        createdAt: at('2026-04-08T12:00:00.000Z'),
        destination: 'Toronto, ON',
        carrier: 'Driver: User 5',
        qtyLabel: '15 × Std + 3 × XL',
        declaredQty: 18,
        trailersCount: 2,
        nextStep: 'Loading · 2h 14m',
        totalCents: 1_280_00,
        commentCount: 2,
        photoCount: 4,
        accountId: account.id,
        hubId: markham.id,
        createdById: byCode.U1.id,
        cargoLines: {
          create: [
            { qty: 15, unit: CargoUnit.STANDARD, unitSize: '48×40' },
            { qty: 3, unit: CargoUnit.XL, unitSize: '48×48' },
          ],
        },
        subOrders: {
          create: [
            { number: 'FR001676-1', refNumber: 'REF-1001', pallets: 9 },
            { number: 'FR001676-2', refNumber: 'REF-1003', pallets: 6 },
            { number: 'FR001676-3', refNumber: 'REF-1002', pallets: 12 },
          ],
        },
      },
    }),
    prisma.order.create({
      data: {
        number: 'FR001681',
        type: OrderType.CROSS_DOCK,
        service: 'Storage',
        services: ['Storage'],
        status: OrderStatus.NEW,
        statusLabel: 'New',
        awaitingAction: true,
        scheduledAt: at('2026-04-15T14:00:00.000Z'),
        createdAt: at('2026-04-14T10:00:00.000Z'),
        destination: 'Detroit, MI',
        destinationNote: 'via External PDF',
        carrier: 'Schneider',
        qtyLabel: '23 × Standard',
        declaredQty: 23,
        refNumber: 'REF-1004',
        nextStep: 'Waiting for truck',
        totalCents: 890_00,
        accountId: account.id,
        hubId: toronto.id,
        createdById: byCode.U2.id,
        cargoLines: {
          create: [{ qty: 23, unit: CargoUnit.STANDARD, unitSize: '48×40' }],
        },
      },
    }),
    prisma.order.create({
      data: {
        number: 'FR001674',
        type: OrderType.CONSOLIDATION,
        status: OrderStatus.IN_PROGRESS,
        statusLabel: 'Alert',
        hasAlert: true,
        alertReason: 'photo missing',
        scheduledAt: at('2026-04-13T11:00:00.000Z'),
        createdAt: at('2026-04-10T09:00:00.000Z'),
        destination: 'Calgary, AB',
        carrier: 'TForce',
        qtyLabel: '20 decl · 18 actual',
        declaredQty: 20,
        actualQty: 18,
        trailersCount: 1,
        nextStep: 'Upload photo',
        nextStepUrgent: true,
        totalCents: 1_540_00,
        commentCount: 1,
        photoCount: 0,
        requiredPhotos: 2,
        accountId: account.id,
        hubId: markham.id,
        createdById: byCode.U3.id,
        cargoLines: {
          create: [{ qty: 20, unit: CargoUnit.STANDARD, unitSize: '48×40' }],
        },
        subOrders: {
          create: [
            { number: 'FR001674-1', refNumber: 'REF-1005', pallets: 11 },
            {
              number: 'FR001674-2',
              refNumber: 'REF-1006',
              pallets: 7,
              alert: 'missing photo',
            },
          ],
        },
      },
    }),
    prisma.order.create({
      data: {
        number: 'FR001672',
        type: OrderType.CROSS_DOCK,
        service: 'Pickup',
        services: ['Pickup'],
        status: OrderStatus.COMPLETED,
        statusLabel: 'Completed',
        scheduledAt: at('2026-04-14T17:30:00.000Z'),
        completedAt: at('2026-04-14T18:10:00.000Z'),
        createdAt: at('2026-04-12T08:00:00.000Z'),
        destination: 'Brampton, ON',
        destinationNote: 'Order with photos',
        carrier: 'Self pickup',
        qtyLabel: '10 × XL',
        declaredQty: 10,
        actualQty: 10,
        refNumber: 'REF-1007',
        nextStep: 'Paid · $320 · #001812',
        totalCents: 32_000,
        invoiceNumber: '001812',
        photoCount: 6,
        accountId: account.id,
        hubId: markham.id,
        createdById: byCode.U1.id,
        cargoLines: {
          create: [{ qty: 10, unit: CargoUnit.XL, unitSize: '48×48' }],
        },
      },
    }),
    prisma.order.create({
      data: {
        number: 'FR001668',
        type: OrderType.CONSOLIDATION,
        status: OrderStatus.CLOSED,
        statusLabel: 'Done',
        scheduledAt: at('2026-04-11T08:00:00.000Z'),
        completedAt: at('2026-04-11T19:00:00.000Z'),
        createdAt: at('2026-04-07T11:00:00.000Z'),
        destination: 'Toronto, ON',
        destinationNote: 'Mark→Tor',
        carrier: 'TForce',
        qtyLabel: '28 × Std',
        declaredQty: 28,
        actualQty: 28,
        trailersCount: 2,
        nextStep: 'Closed',
        totalCents: 2_180_00,
        accountId: account.id,
        hubId: markham.id,
        createdById: byCode.U4.id,
        cargoLines: {
          create: [{ qty: 28, unit: CargoUnit.STANDARD, unitSize: '48×40' }],
        },
        subOrders: {
          create: [
            { number: 'FR001668-1', refNumber: 'REF-1008', pallets: 15 },
            { number: 'FR001668-2', refNumber: 'REF-1009', pallets: 8 },
            { number: 'FR001668-3', refNumber: 'REF-1010', pallets: 20 },
            { number: 'FR001668-4', refNumber: 'REF-1011', pallets: 12 },
          ],
        },
      },
    }),
    prisma.order.create({
      data: {
        number: 'DRAFT-003',
        type: OrderType.CONSOLIDATION,
        status: OrderStatus.DRAFT,
        statusLabel: 'Draft',
        scheduledAt: at('2026-04-16T09:00:00.000Z'),
        createdAt: at('2026-04-16T08:30:00.000Z'),
        nextStep: 'Continue editing',
        accountId: account.id,
        hubId: markham.id,
        createdById: byCode.U1.id,
      },
    }),
    prisma.order.create({
      data: {
        number: 'FR001383',
        type: OrderType.CROSS_DOCK,
        service: 'Transload',
        services: ['Transload', 'Restock & Rework'],
        status: OrderStatus.ON_STOCK,
        statusLabel: 'On Stock',
        scheduledAt: at('2026-04-17T08:00:00.000Z'),
        createdAt: at('2026-04-16T14:00:00.000Z'),
        customer: 'R-way Transport',
        carrier: 'R-way Transport Inc.',
        carrierPhone: '+1 647 555 0199',
        destination: 'Markham, ON',
        qtyLabel: '10 Std · 48×40',
        declaredQty: 10,
        actualQty: 12,
        trailerType: 'Van · 53ft',
        truck: 'TRK-4521',
        trailer: 'TRL-8830',
        refNumber: 'REF-1012',
        nextStep: 'Loading in progress',
        warehouseNote:
          'Counted 12 pallets on arrival, BOL says 10. 1 pallet damaged → routed to Disposal.',
        statusFlow: 'Draft → Ready → In Progress → Closed',
        deltasCount: 1,
        deltaLabel: '1 (q-ty)',
        totalCents: 1_120_00,
        commentCount: 1,
        photoCount: 7,
        requiredPhotos: 5,
        accountId: account.id,
        hubId: markham.id,
        createdById: byCode.U2.id,
        cargoLines: {
          create: [{ qty: 10, unit: CargoUnit.STANDARD, unitSize: '48×40' }],
        },
        dock: {
          create: {
            dockNumber: 12,
            bay: 'B',
            trailer: 'TRL-8830',
            assignedAt: at('2026-04-17T08:42:00.000Z'),
            statusLabel: 'Trailer docked · loading',
            assignedToId: byCode.U6.id,
          },
        },
        operations: {
          create: [
            {
              type: OperationType.UNLOADING,
              billable: true,
              trailer: 'TRL-8830',
              qty: 12,
              unit: 'Standard (48×40)',
              appliedAt: at('2026-04-17T08:55:00.000Z'),
              photoCount: 4,
            },
            {
              type: OperationType.DISPOSAL,
              billable: false,
              qty: 1,
              unit: 'Standard (48×40)',
              appliedAt: at('2026-04-17T09:10:00.000Z'),
              commentCount: 1,
              photoCount: 2,
            },
            {
              type: OperationType.RESTACK,
              billable: false,
              qty: 11,
              unit: 'Standard (48×40)',
              appliedAt: at('2026-04-17T09:25:00.000Z'),
              photoCount: 1,
            },
            {
              type: OperationType.LOADING,
              billable: true,
              trailer: 'TRL-8830',
              qty: 11,
              unit: 'Standard (48×40)',
              appliedAt: at('2026-04-17T10:40:00.000Z'),
            },
          ],
        },
        supplies: {
          create: [
            { sku: 'Straps 12', category: 'Securement', qty: 4, unitCents: 450 },
            {
              sku: 'Corners 50',
              category: 'Edge protect',
              qty: 16,
              unitCents: 85,
            },
            {
              sku: 'Shrink wrap 120g',
              category: 'Wrap',
              qty: 2,
              unitCents: 1200,
            },
          ],
        },
      },
    }),
  ];

  await Promise.all(featured);

  const carriers = ['Schneider', 'TForce', 'XPO', 'Estes', 'R-way Transport Inc.'];
  const dests = [
    'Detroit, MI',
    'Buffalo, NY',
    'Montreal, QC',
    'Ottawa, ON',
    'Hamilton, ON',
    'London, ON',
    'Windsor, ON',
    'Calgary, AB',
  ];
  const creators = [byCode.U1, byCode.U2, byCode.U3, byCode.U4];
  const services = ['Storage', 'Pickup', 'Transload', 'Restock & Rework'];

  // 3 extra active orders (Need Attention #2 is FR001690 awaiting docs)
  const extraActive = [
    {
      number: 'FR001690',
      status: OrderStatus.READY,
      statusLabel: 'Ready',
      awaitingAction: true,
      nextStep: 'Confirm appointment',
      type: OrderType.CROSS_DOCK,
      hubId: toronto.id,
      scheduledAt: at('2026-04-16T13:00:00.000Z'),
      createdAt: at('2026-04-15T09:00:00.000Z'),
      service: 'Storage',
    },
    {
      number: 'FR001691',
      status: OrderStatus.IN_PROGRESS,
      statusLabel: 'In progress',
      nextStep: 'Unloading',
      type: OrderType.CROSS_DOCK,
      hubId: markham.id,
      scheduledAt: at('2026-04-16T07:30:00.000Z'),
      createdAt: at('2026-04-13T11:00:00.000Z'),
      service: 'Transload',
    },
    {
      number: 'FR001692',
      status: OrderStatus.CONSOLIDATED,
      statusLabel: 'Consolidated',
      nextStep: 'In transit to Toronto',
      type: OrderType.CONSOLIDATION,
      hubId: markham.id,
      scheduledAt: at('2026-04-15T10:00:00.000Z'),
      createdAt: at('2026-04-12T16:00:00.000Z'),
      trailersCount: 1,
    },
  ];

  for (const [i, row] of extraActive.entries()) {
    const qty = 8 + i * 3;
    await prisma.order.create({
      data: {
        ...row,
        services: row.service ? [row.service] : [],
        destination: dests[i],
        carrier: carriers[i],
        qtyLabel: `${qty} × Standard`,
        declaredQty: qty,
        refNumber: `REF-11${10 + i}`,
        totalCents: 40_000 + i * 12_000,
        accountId: account.id,
        createdById: creators[i % creators.length].id,
        cargoLines: {
          create: [{ qty, unit: CargoUnit.STANDARD, unitSize: '48×40' }],
        },
      },
    });
  }

  // One extra alert so Alerts tab = 2
  await prisma.order.create({
    data: {
      number: 'FR001655',
      type: OrderType.CROSS_DOCK,
      service: 'Pickup',
      services: ['Pickup'],
      status: OrderStatus.IN_PROGRESS,
      statusLabel: 'Alert',
      hasAlert: true,
      alertReason: 'qty mismatch',
      scheduledAt: at('2026-04-10T15:00:00.000Z'),
      createdAt: at('2026-04-09T10:00:00.000Z'),
      destination: 'Hamilton, ON',
      carrier: 'Estes',
      qtyLabel: '14 decl · 12 actual',
      declaredQty: 14,
      actualQty: 12,
      refNumber: 'REF-1090',
      nextStep: 'Review delta',
      nextStepUrgent: true,
      totalCents: 67_000,
      accountId: account.id,
      hubId: toronto.id,
      createdById: byCode.U3.id,
    },
  });

  // Historical completed orders: 22 in last 30d (plus FR001672, FR001668 = 24)
  // and 20 in previous 30d → +20% vs previous month (mockup +18% is close)
  const last30: Array<{ weekOffset: number; count: number }> = [
    { weekOffset: 0, count: 3 },
    { weekOffset: 1, count: 5 },
    { weekOffset: 2, count: 6 },
    { weekOffset: 3, count: 8 },
  ];
  const prev30: Array<{ weekOffset: number; count: number }> = [
    { weekOffset: 4, count: 4 },
    { weekOffset: 5, count: 5 },
    { weekOffset: 6, count: 5 },
    { weekOffset: 7, count: 6 },
  ];
  const older: Array<{ weekOffset: number; count: number }> = [
    { weekOffset: 8, count: 3 },
    { weekOffset: 9, count: 4 },
    { weekOffset: 10, count: 3 },
    { weekOffset: 11, count: 2 },
  ];

  let seq = 1400;
  const demoNow = at('2026-04-17T12:00:00.000Z');

  for (const bucket of [...last30, ...prev30, ...older]) {
    for (let i = 0; i < bucket.count; i++) {
      seq += 1;
      const completedAt = new Date(demoNow);
      completedAt.setDate(completedAt.getDate() - bucket.weekOffset * 7 - (i % 5));
      completedAt.setHours(16, i * 7, 0, 0);
      const scheduledAt = new Date(completedAt);
      scheduledAt.setHours(scheduledAt.getHours() - 6);
      const isCons = seq % 7 === 0;
      const hub = seq % 2 === 0 ? markham : toronto;
      const creator = creators[seq % creators.length];
      const qty = 6 + (seq % 18);
      const unit = seq % 5 === 0 ? CargoUnit.XL : CargoUnit.STANDARD;
      const number = `FR${String(seq).padStart(6, '0')}`;
      const spend = 28_000 + (seq % 12) * 9_500 + (isCons ? 40_000 : 0);

      await prisma.order.create({
        data: {
          number,
          type: isCons ? OrderType.CONSOLIDATION : OrderType.CROSS_DOCK,
          service: isCons ? null : services[seq % services.length],
          services: isCons ? [] : [services[seq % services.length]],
          status: seq % 4 === 0 ? OrderStatus.CLOSED : OrderStatus.COMPLETED,
          statusLabel: seq % 4 === 0 ? 'Closed' : 'Completed',
          scheduledAt,
          completedAt,
          createdAt: new Date(scheduledAt.getTime() - 86400000 * 2),
          destination: dests[seq % dests.length],
          carrier: carriers[seq % carriers.length],
          qtyLabel: `${qty} × ${unit === CargoUnit.XL ? 'XL' : 'Std'}`,
          declaredQty: qty,
          actualQty: qty,
          refNumber: `REF-${2000 + seq}`,
          nextStep: 'Paid',
          totalCents: spend,
          invoiceNumber: String(1800 + seq),
          trailersCount: isCons ? 1 + (seq % 2) : null,
          accountId: account.id,
          hubId: hub.id,
          createdById: creator.id,
          cargoLines: {
            create: [
              {
                qty,
                unit,
                unitSize: unit === CargoUnit.XL ? '48×48' : '48×40',
              },
            ],
          },
          ...(isCons
            ? {
                subOrders: {
                  create: [
                    {
                      number: `${number}-1`,
                      refNumber: `REF-${3000 + seq}`,
                      pallets: Math.ceil(qty / 2),
                    },
                    {
                      number: `${number}-2`,
                      refNumber: `REF-${4000 + seq}`,
                      pallets: Math.floor(qty / 2),
                    },
                  ],
                },
              }
            : {}),
        },
      });
    }
  }

  const total = await prisma.order.count();
  // eslint-disable-next-line no-console
  console.log(`Seeded ${total} orders for account ${account.company}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
