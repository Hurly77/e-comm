import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserShippingAddress } from './entities/user-shipping-address.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserShippingAddress], 'ecommerce-db')],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
