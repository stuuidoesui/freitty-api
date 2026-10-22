import { ForbiddenException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import {
  assertClientStatusTransition,
  isClientTransitionAllowed,
  toPipelineColumn,
} from './status.rules';

describe('status.rules', () => {
  it('allows client Draft → Ready', () => {
    expect(
      isClientTransitionAllowed(OrderStatus.DRAFT, OrderStatus.READY),
    ).toBe(true);
    expect(() =>
      assertClientStatusTransition(OrderStatus.DRAFT, OrderStatus.READY),
    ).not.toThrow();
  });

  it('forbids client Ready → In Progress', () => {
    expect(
      isClientTransitionAllowed(OrderStatus.READY, OrderStatus.IN_PROGRESS),
    ).toBe(false);
    expect(() =>
      assertClientStatusTransition(OrderStatus.READY, OrderStatus.IN_PROGRESS),
    ).toThrow(ForbiddenException);
  });

  it('forbids skipping columns', () => {
    expect(() =>
      assertClientStatusTransition(OrderStatus.DRAFT, OrderStatus.CLOSED),
    ).toThrow(ForbiddenException);
  });

  it('maps operational statuses onto pipeline columns', () => {
    expect(toPipelineColumn(OrderStatus.NEW)).toBe('READY');
    expect(toPipelineColumn(OrderStatus.ON_STOCK)).toBe('IN_PROGRESS');
    expect(toPipelineColumn(OrderStatus.COMPLETED)).toBe('CLOSED');
  });
});
