import { Injectable } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { AuthRole } from 'src/types/enums';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer, 'ecommerce-db')
    private customerRepo: Repository<Customer>,
  ) {}

  create(createCustomerDto: CreateCustomerDto) {
    return this.customerRepo.save({
      ...createCustomerDto,
      role: AuthRole.CUSTOMER,
    });
  }

  findAll() {
    return this.customerRepo.find();
  }

  findOne(id: number) {
    return this.customerRepo.findOne({
      where: { id },
    });
  }

  findOneByEmail(email: string) {
    return this.customerRepo.findOne({
      where: { email },
    });
  }

  update(id: number, updateCustomerDto: UpdateCustomerDto) {
    return this.customerRepo.update(id, updateCustomerDto);
  }

  remove(id: number) {
    return this.customerRepo.delete(id);
  }
}
