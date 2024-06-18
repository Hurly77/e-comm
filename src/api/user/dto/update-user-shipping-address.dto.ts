import { PartialType } from '@nestjs/mapped-types';
import { CreateUserShippingAddress } from './create-user-shipping-address.dto';

export class UpdateUserShippingAddress extends PartialType(CreateUserShippingAddress) {}
