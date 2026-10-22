import {
  CargoUnit,
  OperationType,
  OrderStatus,
  OrderType,
  UserRole,
} from '@prisma/client';
import { toPipelineColumn } from './status.rules';

export type OrderWithRelations = {
  number: string;
  type: OrderType;
  service: string | null;
  services: string[];
  status: OrderStatus;
  statusLabel: string;
  hasAlert: boolean;
  alertReason: string | null;
  awaitingAction: boolean;
  scheduledAt: Date | null;
  completedAt: Date | null;
  destination: string | null;
  destinationNote: string | null;
  carrier: string | null;
  carrierPhone: string | null;
  customer: string | null;
  declaredQty: number | null;
  actualQty: number | null;
  qtyLabel: string | null;
  trailerType: string | null;
  truck: string | null;
  trailer: string | null;
  trailersCount: number | null;
  nextStep: string | null;
  nextStepUrgent: boolean;
  totalCents: number;
  invoiceNumber: string | null;
  commentCount: number;
  photoCount: number;
  requiredPhotos: number;
  warehouseNote: string | null;
  statusFlow: string | null;
  deltasCount: number;
  deltaLabel: string | null;
  refNumber: string | null;
  hub: { name: string; region: string };
  createdBy: {
    code: string;
    name: string;
    role: UserRole;
    avatarColor: string;
  };
  subOrders: {
    number: string;
    refNumber: string;
    pallets: number;
    alert: string | null;
  }[];
  cargoLines?: { qty: number; unit: CargoUnit; unitSize: string | null }[];
  dock?: {
    dockNumber: number;
    bay: string;
    trailer: string | null;
    assignedAt: Date;
    statusLabel: string;
    assignedTo: {
      code: string;
      name: string;
      role: UserRole;
    } | null;
  } | null;
  operations?: {
    type: OperationType;
    billable: boolean;
    trailer: string | null;
    qty: number;
    unit: string;
    appliedAt: Date;
    commentCount: number;
    photoCount: number;
  }[];
  supplies?: {
    sku: string;
    category: string;
    qty: number;
    unitCents: number;
  }[];
};

function mapUser(user: {
  code: string;
  name: string;
  role: UserRole;
  avatarColor?: string;
}) {
  return {
    code: user.code,
    name: user.name,
    role: user.role,
    avatarColor: user.avatarColor,
  };
}

export function toOrderListItem(order: OrderWithRelations) {
  return {
    number: order.number,
    type: order.type,
    service: order.service,
    status: order.status,
    statusLabel: order.statusLabel,
    pipelineColumn: toPipelineColumn(order.status),
    hasAlert: order.hasAlert,
    alertReason: order.alertReason,
    awaitingAction: order.awaitingAction,
    scheduledAt: order.scheduledAt?.toISOString() ?? null,
    hub: order.hub,
    qtyLabel: order.qtyLabel,
    declaredQty: order.declaredQty,
    actualQty: order.actualQty,
    carrier: order.carrier,
    destination: order.destination,
    destinationNote: order.destinationNote,
    trailersCount: order.trailersCount,
    nextStep: order.nextStep,
    nextStepUrgent: order.nextStepUrgent,
    createdBy: mapUser(order.createdBy),
    subOrders: order.subOrders,
    refNumber: order.refNumber,
    commentCount: order.commentCount,
    photoCount: order.photoCount,
    invoiceNumber: order.invoiceNumber,
    totalCents: order.totalCents,
    isDraft: order.status === OrderStatus.DRAFT,
  };
}

export function toOrderDetail(order: OrderWithRelations) {
  const supplies = (order.supplies ?? []).map((s) => ({
    sku: s.sku,
    category: s.category,
    qty: s.qty,
    unitCents: s.unitCents,
    lineTotalCents: s.qty * s.unitCents,
  }));
  const supplySubtotalCents = supplies.reduce(
    (sum, s) => sum + s.lineTotalCents,
    0,
  );

  return {
    ...toOrderListItem(order),
    services: order.services,
    customer: order.customer,
    carrierPhone: order.carrierPhone,
    trailerType: order.trailerType,
    truck: order.truck,
    trailer: order.trailer,
    warehouseNote: order.warehouseNote,
    statusFlow: order.statusFlow,
    deltasCount: order.deltasCount,
    deltaLabel: order.deltaLabel,
    requiredPhotos: order.requiredPhotos,
    completedAt: order.completedAt?.toISOString() ?? null,
    cargoLines: order.cargoLines ?? [],
    dock: order.dock
      ? {
          dockNumber: order.dock.dockNumber,
          bay: order.dock.bay,
          trailer: order.dock.trailer,
          assignedAt: order.dock.assignedAt.toISOString(),
          statusLabel: order.dock.statusLabel,
          assignedTo: order.dock.assignedTo
            ? mapUser(order.dock.assignedTo)
            : null,
        }
      : null,
    operations: (order.operations ?? []).map((op) => ({
      type: op.type,
      billable: op.billable,
      trailer: op.trailer,
      qty: op.qty,
      unit: op.unit,
      appliedAt: op.appliedAt.toISOString(),
      commentCount: op.commentCount,
      photoCount: op.photoCount,
    })),
    supplies,
    supplySubtotalCents,
  };
}
