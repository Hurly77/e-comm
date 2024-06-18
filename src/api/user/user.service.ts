import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { AuthRole } from 'src/types/enums';
import { CreateUserShippingAddress } from './dto/create-user-shipping-address.dto';
import { UserShippingAddress } from './entities/user-shipping-address.entity';
import { UpdateUserShippingAddress } from './dto/update-user-shipping-address.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User, 'ecommerce-db')
    private userRepo: Repository<User>,
    @InjectRepository(UserShippingAddress, 'ecommerce-db')
    private userShippingAddressRepo: Repository<UserShippingAddress>,
  ) {}

  public async create(createUserDto: CreateUserDto) {
    return this.userRepo.save({
      ...createUserDto,
      role: AuthRole.CUSTOMER,
    });
  }

  public async createAdmin(createUserDto: CreateUserDto) {
    console.log('Saving Admin from UserService');
    return this.userRepo.save({
      ...createUserDto,
      role: AuthRole.ADMIN,
    });
  }

  public async findAll() {
    return this.userRepo.find();
  }

  public async findOne(id: number) {
    return this.userRepo.findOne({
      where: { id },
    });
  }

  public async findUserAndCart(id: number) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['cart', 'cart.items', 'cart.items.product', 'cart.items.product.thumbnail'],
      order: {
        cart: {
          items: {
            created_at: 'DESC',
          },
        },
      },
    });

    return user;
  }

  public async findCustomerByEmail(email: string) {
    return this.userRepo.findOne({
      where: { email, role: AuthRole.CUSTOMER },
    });
  }

  public async findAdminByEmail(email: string) {
    return this.userRepo.findOne({
      where: { email, role: AuthRole.ADMIN },
    });
  }

  public async update(id: number, updateUserDto: UpdateUserDto) {
    return this.userRepo.update(id, updateUserDto);
  }

  public async remove(id: number) {
    return this.userRepo.delete(id);
  }

  // Shipping Related User Queries ===============
  public async getStripeCustomerId(user_id: number) {
    const user = await this.userRepo.findOne({
      select: ['stripe_customer_id'],
      where: { id: user_id },
    });

    return user?.stripe_customer_id;
  }

  public async findUserShippingAddresses(user_id: number) {
    const user = await this.userRepo.findOne({
      where: { id: user_id },
      relations: ['shipping_addresses'],
    });

    return { addresses: user.shipping_addresses, default_address_id: user.default_shipping_address_id };
  }

  public async createUserShippingAddress(user_id: number, address: CreateUserShippingAddress) {
    const user = await this.userRepo.findOne({ where: { id: user_id } });

    if (!user) throw new Error('User not found');
    const { is_default, ...rest } = address;
    const shippingAddress = await this.userShippingAddressRepo.save({ ...rest, user });
    if (is_default) await this.updateDefaultShippingAddress(user_id, shippingAddress.id);

    return shippingAddress;
  }

  public async findUserShippingAddressById(user_id: number, address_id: number) {
    const shippingAddress = await this.userShippingAddressRepo.findOne({
      where: { id: address_id, user: { id: user_id } },
    });

    return shippingAddress;
  }

  public async updateUserShippingAddress(user_id: number, address_id: number, updates: UpdateUserShippingAddress) {
    const address = await this.userShippingAddressRepo.findOne({
      where: { id: address_id, user: { id: user_id } },
    });

    if (!address) throw new Error('Address not found');

    const { is_default, ...rest } = updates;
    if (is_default) await this.updateDefaultShippingAddress(user_id, address_id);
    return await this.userShippingAddressRepo.save({
      ...address,
      ...rest,
    });
  }

  public async updateDefaultShippingAddress(user_id: number, address_id: number) {
    await this.userRepo.update(user_id, { default_shipping_address_id: address_id });
    return { address_id };
  }

  public async deleteShippingAddress(user_id: number, address_id: number) {
    return this.userShippingAddressRepo.softDelete({ id: address_id, user: { id: user_id } });
  }
}
