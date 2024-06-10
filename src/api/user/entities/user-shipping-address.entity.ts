import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import Stripe from 'stripe';

@Entity()
export class UserShippingAddress implements Required<Stripe.AddressParam> {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  is_default: boolean;

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

  @ManyToOne(() => User, (user) => user.shipping_addresses)
  user: User;
}
