import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProductModule } from './api/product/product.module';
import { Product } from './api/product/entities/product.entity';
import { AuthModule } from './api/auth/auth.module';
import { JwtAuthGuard } from './api/auth/jwt-auth-guard';
import { APP_GUARD } from '@nestjs/core';
import { ProductImage } from './api/product/entities/product-image.entity';
import { SeedModule } from './core/seed/seed.module';
import { DatabaseModule } from './core/database/database.module';
import { CategoryModule } from './api/category/category.module';
import { Category } from './api/category/entities/category.entity';
import { UserModule } from './api/user/user.module';
import { User } from './api/user/entities/user.entity';
import { CartModule } from './api/cart/cart.module';
import { OrderModule } from './api/order/order.module';
import { Cart } from './api/cart/entities/cart.entity';
import { CartItem } from './api/cart/entities/cart-item.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes the config globally available
      envFilePath: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
    }),
    TypeOrmModule.forRootAsync({
      name: 'ecommerce-db',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        console.log(configService.get('POSTGRES_HOST'));
        console.log(configService.get('POSTGRES_PORT'));
        console.log(configService.get('POSTGRES_USER'));
        console.log(configService.get('POSTGRES_PASSWORD'));
        console.log(configService.get('POSTGRES_DB'));
        return {
          type: 'postgres',
          host: configService.get('POSTGRES_HOST'),
          port: configService.get('POSTGRES_PORT'),
          username: configService.get('POSTGRES_USER'),
          password: configService.get('POSTGRES_PASSWORD'),
          database: configService.get('POSTGRES_DB'),
          entities: [Product, ProductImage, User, Category, Cart, CartItem],
          synchronize: false,
        };
      },
    }),
    ProductModule,
    AuthModule,
    SeedModule,
    DatabaseModule,
    CategoryModule,
    UserModule,
    CartModule,
    OrderModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
