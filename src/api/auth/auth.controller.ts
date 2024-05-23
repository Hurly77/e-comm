import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { AuthRole } from '../../types/enums';
import { Public } from 'src/decorators/Public';
import { CreateUserDto } from '../user/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  loginCustomer(@Body() createAuthDto: CreateAuthDto) {
    const role = createAuthDto.role;
    if (role === AuthRole.CUSTOMER) {
      return this.authService.loginCustomer(createAuthDto);
    }
  }

  @Post('register')
  @Public()
  registerCustomer(@Body() createCustomerDto: CreateUserDto) {
    return this.authService.registerCustomer(createCustomerDto);
  }

  @Post('admin/login')
  @Public()
  loginAdmin(@Body() createAuthDto: CreateAuthDto) {
    if (createAuthDto.role === AuthRole.ADMIN) {
      return this.authService.loginAdmin(createAuthDto);
    }
  }

  @Post('admin/register')
  @Public()
  registerAdmin(@Body() createAdminDto: CreateUserDto) {
    return this.authService.registerAdmin(createAdminDto);
  }
}
