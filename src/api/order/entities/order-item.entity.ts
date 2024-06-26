import { Entity, Column, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { Order } from './order.entity';
import { Product } from 'src/api/product/entities/product.entity';
import { ColumnNumericTransformer } from 'src/pipes/numeric-transformer';

@Entity()
export class OrderItem {
  constructor(partial: Partial<OrderItem>) {
    Object.assign(this, partial);
  }
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 5, scale: 2, transformer: new ColumnNumericTransformer() })
  price: number;

  @Column()
  quantity: number;

  @ManyToOne(() => Order, (order) => order.items, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Product, (product) => product.orderItems)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
