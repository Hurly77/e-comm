import { Cart } from 'src/api/cart/entities/cart.entity';
import { AuthRole } from 'src/types/enums';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserShippingAddress } from './user-shipping-address.entity';
import { Order } from 'src/api/order/entities/order.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  address: string | null;

  @Column()
  phone_number: string;

  @Column('varchar', { nullable: true, length: 18 })
  stripe_customer_id: string | null;

  @Column()
  role: AuthRole;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => UserShippingAddress, (shippingAddress) => shippingAddress.user)
  @JoinColumn()
  shipping_addresses: UserShippingAddress[];

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @OneToOne(() => Cart, (cart) => cart.user, { cascade: ['remove'] })
  @JoinColumn()
  cart: Cart;
}
