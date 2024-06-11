export class CreateOrderDto {
  stripe_pm_id: string;
  stripe_pm_intent_id: string;
  user_id: number;
  cart_id: number;
  shipping_address_id: number;
}
