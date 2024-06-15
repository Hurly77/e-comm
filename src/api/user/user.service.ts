import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { AuthRole } from 'src/types/enums';
import { CreateUserShippingAddress } from './dto/create-user-shipping-address.dto';
import { UserShippingAddress } from './entities/user-shipping-address.entity';

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

  // Shipping Related User Queries ===============
  public async findUserShippingAddresses(id: number) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['shipping_addresses'],
    });

    return user.shipping_addresses;
  }

  public async createUserShippingAddress(user_id: number, address: CreateUserShippingAddress) {
    const user = await this.userRepo.findOne({ where: { id: user_id } });

    if (!user) throw new Error('User not found');

    const shippingAddress = await this.userShippingAddressRepo.save({ ...address, user });

    return shippingAddress;
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

  public async findUserShippingAddressById(user_id: number, address_id: number) {
    const shippingAddress = await this.userShippingAddressRepo.findOne({
      where: { id: address_id, user: { id: user_id } },
    });

    return shippingAddress;
  }

  public async update(id: number, updateUserDto: UpdateUserDto) {
    return this.userRepo.update(id, updateUserDto);
  }

  public async remove(id: number) {
    return this.userRepo.delete(id);
  }
}
