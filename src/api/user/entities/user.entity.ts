import { Cart } from 'src/api/cart/entities/cart.entity';
import { AuthRole } from 'src/types/enums';
import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserShippingAddress } from './user-shipping-address.entity';

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

  @OneToMany(() => UserShippingAddress, (shippingAddress) => shippingAddress.user, { cascade: true })
  shipping_addresses: UserShippingAddress[];

  @OneToOne(() => Cart, (cart) => cart.user, { cascade: true })
  @JoinColumn()
  cart: Cart;
}
