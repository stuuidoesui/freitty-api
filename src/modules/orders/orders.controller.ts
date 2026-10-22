import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Query,
  Res,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ListOrdersDto, PatchStatusDto } from './dto/list-orders.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Paginated order list with filters' })
  list(@Query() query: ListOrdersDto) {
    return this.orders.list(query);
  }

  @Get('counts')
  @ApiOperation({ summary: 'Tab counters for the order list' })
  counts() {
    return this.orders.counts();
  }

  @Get('export.csv')
  @ApiOperation({ summary: 'Export filtered orders as CSV' })
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async export(@Query() query: ListOrdersDto, @Res() res: Response) {
    const csv = await this.orders.exportCsv(query);
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="freitty-orders.csv"',
    );
    res.send(csv);
  }

  @Get(':number')
  @ApiOperation({ summary: 'Full order detail' })
  @ApiOkResponse({ description: 'Order detail' })
  findOne(@Param('number') number: string) {
    return this.orders.findByNumber(number);
  }

  @Patch(':number/status')
  @ApiOperation({
    summary: 'Move order along the pipeline (client: Draft → Ready only)',
  })
  patchStatus(@Param('number') number: string, @Body() body: PatchStatusDto) {
    return this.orders.updateStatus(number, body.status);
  }
}
