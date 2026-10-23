import { OrderStatus } from '@prisma/client';

export const PIPELINE_COLUMNS = [
  'DRAFT',
  'READY',
  'IN_PROGRESS',
  'CONSOLIDATED',
  'IN_TRANSIT',
  'DECONSOLIDATED',
  'CLOSED',
] as const;

export type PipelineColumn = (typeof PIPELINE_COLUMNS)[number];

export function toPipelineColumn(status: OrderStatus): PipelineColumn {
  switch (status) {
    case OrderStatus.DRAFT:
      return 'DRAFT';
    case OrderStatus.NEW:
    case OrderStatus.READY:
      return 'READY';
    case OrderStatus.IN_PROGRESS:
    case OrderStatus.ON_STOCK:
      return 'IN_PROGRESS';
    case OrderStatus.CONSOLIDATED:
      return 'CONSOLIDATED';
    case OrderStatus.IN_TRANSIT:
      return 'IN_TRANSIT';
    case OrderStatus.DECONSOLIDATED:
      return 'DECONSOLIDATED';
    case OrderStatus.COMPLETED:
    case OrderStatus.CLOSED:
      return 'CLOSED';
    default:
      return 'IN_PROGRESS';
  }
}

export function statusLabelFor(status: OrderStatus, hasAlert: boolean): string {
  if (hasAlert) return 'Alert';
  switch (status) {
    case OrderStatus.DRAFT:
      return 'Draft';
    case OrderStatus.NEW:
      return 'New';
    case OrderStatus.READY:
      return 'Ready';
    case OrderStatus.IN_PROGRESS:
      return 'In progress';
    case OrderStatus.ON_STOCK:
      return 'On Stock';
    case OrderStatus.CONSOLIDATED:
      return 'Consolidated';
    case OrderStatus.IN_TRANSIT:
      return 'In Transit';
    case OrderStatus.DECONSOLIDATED:
      return 'Deconsolidated';
    case OrderStatus.COMPLETED:
      return 'Completed';
    case OrderStatus.CLOSED:
      return 'Closed';
    default:
      return status;
  }
}

export const ACTIVE_STATUSES: OrderStatus[] = [
  OrderStatus.NEW,
  OrderStatus.READY,
  OrderStatus.IN_PROGRESS,
  OrderStatus.ON_STOCK,
  OrderStatus.CONSOLIDATED,
  OrderStatus.IN_TRANSIT,
  OrderStatus.DECONSOLIDATED,
];

export const COMPLETED_STATUSES: OrderStatus[] = [
  OrderStatus.COMPLETED,
  OrderStatus.CLOSED,
];
