import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import Stripe from 'stripe';
import { Order } from 'src/api/order/entities/order.entity';

@Entity()
export class UserShippingAddress implements Required<Stripe.AddressParam> {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column()
  country: string;

  @Column()
  line1: string;

  @Column({ nullable: true })
  line2: string | null;

  @Column()
  city: string;

  @Column()
  state: string;

  @Column()
  postal_code: string;

  @Column()
  phone_number: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  @ManyToOne(() => User, (user) => user.shipping_addresses, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  user: User;

  @OneToMany(() => Order, (order) => order.shipping_address)
  orders: Order[];
}
