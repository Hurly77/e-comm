import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public } from 'src/decorators/Public';
import { CreateUserShippingAddress } from './dto/create-user-shipping-address.dto';
import { AuthRole } from 'src/types/enums';
import { Roles } from 'src/decorators/Role';
import { UpdateUserShippingAddress } from './dto/update-user-shipping-address.dto';
import { CurrentUser } from 'src/decorators/CurrentUser';
import { User } from './entities/user.entity';

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
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @CurrentUser() user: User) {
    if (user.id !== +id) throw new UnauthorizedException('You are not authorized to update this user');
    return await this.userService.update(+id, updateUserDto);
    // return { message: 'User updated successfully' };
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
  @Get('/shipping-address/:shipping_address_id/customer/:user_id')
  async getUserShippingAddressById(
    @Param('user_id') user_id: string,
    @Param('shipping_address_id') shipping_address_id: string,
  ) {
    const address = await this.userService.findUserShippingAddressById(+user_id, +shipping_address_id);
    if (!address) throw new NotFoundException('Shipping Address not found');

    return address;
  }

  @Roles(AuthRole.CUSTOMER)
  @Post('/shipping-address/:user_id')
  createShippingAddress(
    @Param('user_id') user_id: string,
    @Body() createUserShippingAddress: CreateUserShippingAddress,
  ) {
    return this.userService.createUserShippingAddress(+user_id, createUserShippingAddress);
  }

  @Patch('/shipping-address/:shipping_address_id/customer/:user_id')
  async updateShippingAddress(
    @Param('user_id') user_id: string,
    @Param('shipping_address_id') shipping_address_id: string,
    @Body() addressUpdates: UpdateUserShippingAddress,
  ) {
    const address = await this.userService.findUserShippingAddressById(+user_id, +shipping_address_id);
    if (!address) throw new NotFoundException('Shipping Address not found');

    return this.userService.updateUserShippingAddress(+user_id, +shipping_address_id, addressUpdates);
  }

  @Patch('/shipping-address/default/:shipping_address_id/customer/:user_id')
  async updateDefaultShippingAddress(
    @Param('user_id') user_id: string,
    @Param('shipping_address_id') shipping_address_id: string,
  ) {
    return this.userService.updateDefaultShippingAddress(+user_id, +shipping_address_id);
  }

  @Delete('/shipping-address/:shipping_address_id')
  async deleteShippingAddress(@Param('shipping_address_id') shipping_address_id: string, @CurrentUser() user: User) {
    return await this.userService.deleteShippingAddress(user.id, +shipping_address_id);
  }
}
