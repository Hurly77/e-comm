import { User } from 'src/api/user/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { OrderStatus } from '../dto/order-status.dto';
import { UserShippingAddress } from 'src/api/user/entities/user-shipping-address.entity';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 5, scale: 2 })
  sub_total: number;

  @Column('decimal', { precision: 5, scale: 2 })
  collected_tax: number;

  @Column('decimal', { precision: 5, scale: 2 })
  total_price: number;

  @Column()
  stripe_pm_id: string;

  @Column()
  stripe_pm_intent_id: string;

  @Column('enum', { enum: OrderStatus, default: OrderStatus.PROCESSING })
  status: OrderStatus;

  @CreateDateColumn({ type: 'timestamp' })
  order_date: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => UserShippingAddress, (address) => address.orders)
  @JoinColumn({ name: 'shipping_address_id' })
  shipping_address: UserShippingAddress;

  @OneToMany(() => OrderItem, (item) => item.order)
  items: OrderItem[];
}
