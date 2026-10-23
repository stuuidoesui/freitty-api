import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus, OrderType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum OrderTab {
  ALL = 'all',
  CROSS_DOCK = 'cross-dock',
  CONSOLIDATION = 'consolidation',
  ALERTS = 'alerts',
  DRAFTS = 'drafts',
}

export enum DateRange {
  ALL = 'all',
  TODAY = 'today',
  THIS_WEEK = 'this-week',
  LAST_30 = 'last-30',
}

export class ListOrdersDto {
  @ApiPropertyOptional({ enum: OrderTab, default: OrderTab.ALL })
  @IsOptional()
  @IsEnum(OrderTab)
  tab?: OrderTab = OrderTab.ALL;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hub?: string;

  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ enum: OrderType })
  @IsOptional()
  @IsEnum(OrderType)
  type?: OrderType;

  @ApiPropertyOptional({ enum: DateRange, default: DateRange.ALL })
  @IsOptional()
  @IsEnum(DateRange)
  dateRange?: DateRange = DateRange.ALL;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 12;
}
