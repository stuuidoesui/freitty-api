import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListOrdersDto } from './dto/list-orders.dto';
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

  @Get(':number')
  @ApiOperation({ summary: 'Full order detail' })
  @ApiOkResponse({ description: 'Order detail' })
  findOne(@Param('number') number: string) {
    return this.orders.findByNumber(number);
  }
}
