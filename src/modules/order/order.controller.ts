import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderDto, SaveOrderDto } from 'src/dto/entities.dto';
import { Roles } from 'src/decorators/roles.decorator.ts';
import { PaginatedDto } from 'src/dto/paginated.dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Roles('admin')
  @Post()
  createOrder(@Body() orderInfo: SaveOrderDto) {
    return this.orderService.createOne(orderInfo);
  }

  @Roles('admin')
  @Get()
  listUsers(
    @Query()
    queryParams: {
      userId: string;
      planId: string;
      paymentType: number;
      status: number;
      sort: string;
      page: number;
      pageSize: number;
    },
  ): Promise<PaginatedDto<OrderDto>> {
    return this.orderService.findAll(queryParams);
  }

  @Roles('admin')
  @Get('/total_amount')
  async getTotalOrderAmount() {
    return this.orderService.orderStatistics();
  }
}
