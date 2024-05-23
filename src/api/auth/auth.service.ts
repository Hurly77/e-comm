import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { CustomerService } from '../customer/customer.service';
import * as bcrypt from 'bcrypt';
import { CreateCustomerDto } from '../customer/dto/create-customer.dto';
import { CreateAuthDto } from './dto/create-auth.dto';
import { JwtService } from '@nestjs/jwt';
import { Customer } from '../customer/entities/customer.entity';
import { AdminService } from '../admin/admin.service';
import { Admin } from '../admin/entities/admin.entity';
import { CreateAdminDto } from '../admin/dto/create-admin.dto';

@Injectable()
export class AuthService {
  constructor(
    private customerService: CustomerService,
    private jwtService: JwtService,
    private adminService: AdminService,
  ) {}
  async validateCustomer(email: string, password: string) {
    const customer = await this.customerService.findOneByEmail(email);
    if (!customer) {
      throw new UnauthorizedException('Invalid email or password');
    }
    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(password, customer?.password);
    } catch (err) {
      console.log(err);
    }

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (isPasswordValid) {
      return customer;
    }
  }

  async validateAdmin(email: string, password: string) {
    const admin = await this.adminService.findAdminByEmail(email);
    if (!admin) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const isPasswordValid = await bcrypt.compare(password, admin?.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (isPasswordValid) {
      return admin;
    }
  }

  async registerCustomer(customerDto: CreateCustomerDto) {
    const hashedPassword = await bcrypt.hash(customerDto.password, 10);
    const existingCustomer = await this.customerService.findOneByEmail(customerDto.email);

    if (existingCustomer) {
      throw new ConflictException('User already exists with the provided email');
    }

    const newUser = await this.customerService.create({
      ...customerDto,
      password: hashedPassword,
    });

    return {
      session: { user: newUser, token: this.generateCustomerToken(newUser) },
    };
  }

  async registerAdmin(adminDto: CreateAdminDto) {
    const hashedPassword = await bcrypt.hash(adminDto.password, 10);
    const existingAdmin = await this.adminService.findAdminByEmail(adminDto.email);

    if (existingAdmin) {
      throw new ConflictException('Admin already exists with the provided email');
    }

    const newAdmin = await this.adminService.create({
      ...adminDto,
      password: hashedPassword,
    });

    return {
      session: { user: newAdmin, token: this.generateAdminToken(newAdmin) },
    };
  }

  async loginCustomer(credentials: CreateAuthDto) {
    const customer = await this.validateCustomer(credentials.email, credentials.password);

    if (customer)
      return {
        token: this.generateCustomerToken(customer),
        customer,
      };
  }

  async loginAdmin(credentials: CreateAuthDto) {
    const admin = await this.validateAdmin(credentials.email, credentials.password);

    if (admin)
      return {
        session: {
          token: this.generateAdminToken(admin),
          admin,
        },
      };
  }

  private generateCustomerToken(customer: Customer) {
    return this.jwtService.sign({
      id: customer.id,
      email: customer.email,
      first_name: customer.first_name,
      last_name: customer.last_name,
      role: customer.role,
    });
  }

  private generateAdminToken(admin: Admin) {
    return this.jwtService.sign({
      id: admin.id,
      email: admin.email,
      first_name: admin.first_name,
      last_name: admin.last_name,
      role: admin.role,
    });
  }
}
