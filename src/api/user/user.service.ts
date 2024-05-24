import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { AuthRole } from 'src/types/enums';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User, 'ecommerce-db')
    private userRepo: Repository<User>,
  ) {}

  create(createUserDto: CreateUserDto) {
    return this.userRepo.save({
      ...createUserDto,
      role: AuthRole.CUSTOMER,
    });
  }

  createAdmin(createUserDto: CreateUserDto) {
    return this.userRepo.save({
      ...createUserDto,
      role: AuthRole.ADMIN,
    });
  }

  findAll() {
    return this.userRepo.find();
  }

  findOne(id: number) {
    return this.userRepo.findOne({
      where: { id },
    });
  }

  async findUserAndCart(id: number) {
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

    // console.log(user.cart.items?.[0]?.product?.title);

    return user;
  }

  findCustomerByEmail(email: string) {
    return this.userRepo.findOne({
      where: { email, role: AuthRole.CUSTOMER },
    });
  }

  findAdminByEmail(email: string) {
    return this.userRepo.findOne({
      where: { email, role: AuthRole.ADMIN },
    });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return this.userRepo.update(id, updateUserDto);
  }

  remove(id: number) {
    return this.userRepo.delete(id);
  }
}
