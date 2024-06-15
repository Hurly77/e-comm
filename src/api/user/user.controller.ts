import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public } from 'src/decorators/Public';
import { CreateUserShippingAddress } from './dto/create-user-shipping-address.dto';
import { AuthRole } from 'src/types/enums';
import { Roles } from 'src/decorators/Role';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Public()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }

  // user shipping address routes
  @Roles(AuthRole.CUSTOMER)
  @Get('/shipping-address/:user_id')
  getUserShippingAddresses(@Param('user_id') user_id: string) {
    return this.userService.findUserShippingAddresses(+user_id);
  }

  @Roles(AuthRole.CUSTOMER)
  @Post('/shipping-address/:user_id')
  createShippingAddress(
    @Param('user_id') user_id: string,
    @Body() createUserShippingAddress: CreateUserShippingAddress,
  ) {
    return this.userService.createUserShippingAddress(+user_id, createUserShippingAddress);
  }
}
