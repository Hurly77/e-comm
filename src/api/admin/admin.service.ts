import { Injectable } from '@nestjs/common';
import { CreateAdminDto } from './dto/create-admin.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Admin } from './entities/admin.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin, 'ecommerce-db')
    private adminRepository: Repository<Admin>,
  ) {}

  create(createAdminDto: CreateAdminDto) {
    return this.adminRepository.save(createAdminDto);
  }

  findOne(id: number) {
    return this.adminRepository.findOne({
      where: { id },
    });
  }

  findAdminByEmail(email: string) {
    return this.adminRepository.findOne({
      where: { email },
    });
  }
}
