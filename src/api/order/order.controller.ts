import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  @Get('/user/:user_id')
  findUserOrders(@Param('user_id') user_id: string) {
    return this.orderService.findAllOrdersByUserId(+user_id);
  }

  @Get('/user/:user_id/single/:order_id')
  findOne(@Param('order_id') id: string, @Param('user_id') user_id: string) {
    return this.orderService.findOne(+id, +user_id);
  }
}
