import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProductModule } from './api/product/product.module';
import { Product } from './api/product/entities/product.entity';
import { CustomerModule } from './api/customer/customer.module';
import { Customer } from './api/customer/entities/customer.entity';
import { AuthModule } from './api/auth/auth.module';
import { AdminModule } from './api/admin/admin.module';
import { JwtAuthGuard } from './api/auth/jwt-auth-guard';
import { APP_GUARD } from '@nestjs/core';
import { Admin } from './api/admin/entities/admin.entity';
import { ProductImage } from './api/product/entities/product-image.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes the config globally available
    }),
    TypeOrmModule.forRootAsync({
      name: 'ecommerce-db',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('POSTGRES_HOST'),
        port: configService.get('POSTGRES_PORT'),
        username: configService.get('POSTGRES_USER'),
        password: configService.get('POSTGRES_PASSWORD'),
        database: configService.get('POSTGRES_DB'),
        entities: [Product, ProductImage, Customer, Admin],
        synchronize: true,
      }),
    }),
    ProductModule,
    CustomerModule,
    AuthModule,
    AdminModule,
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
