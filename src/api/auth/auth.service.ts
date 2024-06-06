import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { CreateAuthDto } from './dto/create-auth.dto';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { User } from '../user/entities/user.entity';
import { AuthSession, JWTToken } from './dto/auth-session.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}
  async validateCustomer(email: string, password: string) {
    const customer = await this.userService.findCustomerByEmail(email);
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
    const admin = await this.userService.findAdminByEmail(email);
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

  async registerCustomer(customerDto: CreateUserDto): Promise<AuthSession> {
    const hashedPassword = await bcrypt.hash(customerDto.password, 10);
    const existingCustomer = await this.userService.findCustomerByEmail(customerDto.email);

    if (existingCustomer) {
      throw new ConflictException('User already exists with the provided email');
    }

    const newUser = await this.userService.create({
      ...customerDto,
      password: hashedPassword,
    });

    const { password, ...result } = newUser;
    const { token, exp } = this.generateToken(newUser);

    return { session: { user: result, token, exp } };
  }

  async registerAdmin(adminDto: CreateUserDto): Promise<AuthSession> {
    console.log('Attempting to create Admin (starting hash): ', adminDto);
    const hashedPassword = await bcrypt.hash(adminDto.password, 10);
    console.log('checking if admin exists ');
    const existingAdmin = await this.userService.findAdminByEmail(adminDto.email);

    if (existingAdmin) {
      console.log('Admin already exists throwing error');
      throw new ConflictException('Admin already exists with the provided email');
    }

    console.log('Creating new admin');
    const newAdmin = await this.userService.createAdmin({
      ...adminDto,
      password: hashedPassword,
    });

    const { password, ...result } = newAdmin;
    const { token, exp } = this.generateToken(newAdmin);

    console.log('Returning new admin');
    return { session: { user: result, token, exp } };
  }

  async loginCustomer(credentials: CreateAuthDto): Promise<AuthSession> {
    const user = await this.validateCustomer(credentials.email, credentials.password);
    const { password, ...result } = user;

    const { token, exp } = this.generateToken(user);

    if (user) return { session: { token, exp, user: result } };
  }

  async loginAdmin(credentials: CreateAuthDto): Promise<AuthSession> {
    const admin = await this.validateAdmin(credentials.email, credentials.password);
    const { password, ...result } = admin;

    const { token, exp } = this.generateToken(admin);

    if (admin) return { session: { token, user: result, exp } };
  }

  private generateToken(customer: User) {
    const token = this.jwtService.sign({
      id: customer.id,
      email: customer.email,
      first_name: customer.first_name,
      last_name: customer.last_name,
      role: customer.role,
    });

    const { exp } = this.jwtService.decode<JWTToken>(token);
    return { token, exp: exp * 1000 };
  }
}
