import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  console.log(process.cwd());
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get('PORT');

  // Enable the ability to throw errors based on validations
  // From the DTOs using class-validator
  app.useGlobalPipes(new ValidationPipe());

  app.enableCors();

  // Enable the ability to filter out properties
  // such as passwords from the response
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  await app.listen(+port || 3000);
}
bootstrap();
