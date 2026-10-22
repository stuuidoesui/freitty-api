import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import type { ActivityPeriod } from './dashboard.service';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'KPI cards for the dashboard' })
  summary() {
    return this.dashboard.summary();
  }

  @Get('active-orders')
  @ApiOperation({ summary: 'Active orders shown on the dashboard' })
  active() {
    return this.dashboard.activeOrders();
  }

  @Get('activity')
  @ApiOperation({ summary: 'Completed-orders and spend time series' })
  activity(@Query('period') period?: ActivityPeriod) {
    const allowed: ActivityPeriod[] = ['day', 'week', 'month', 'quarter'];
    const p = allowed.includes(period as ActivityPeriod)
      ? (period as ActivityPeriod)
      : 'month';
    return this.dashboard.activity(p);
  }
}
