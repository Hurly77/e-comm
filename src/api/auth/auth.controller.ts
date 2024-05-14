import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { AuthRole } from '../../types/enums';
import { CreateCustomerDto } from '../customer/dto/create-customer.dto';
import { Public } from 'src/decorators/Public';
import { CreateAdminDto } from '../admin/dto/create-admin.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  loginCustomer(@Body() createAuthDto: CreateAuthDto) {
    const role = createAuthDto.role;
    console.log(role);
    if (role === AuthRole.CUSTOMER) {
      return this.authService.loginCustomer(createAuthDto);
    }
  }

  @Post('register')
  registerCustomer(@Body() createCustomerDto: CreateCustomerDto) {
    return this.authService.registerCustomer(createCustomerDto);
  }

  @Post('admin/login')
  @Public()
  loginAdmin(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.loginAdmin(createAuthDto);
  }

  @Post('admin/register')
  registerAdmin(@Body() createAdminDto: CreateAdminDto) {
    return this.authService.registerAdmin(createAdminDto);
  }
}
