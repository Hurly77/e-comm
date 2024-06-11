import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';
import { OrderStatus } from './order-status.dto';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  status?: OrderStatus;
}
