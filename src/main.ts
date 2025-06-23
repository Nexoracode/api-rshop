import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/interceptors/http-exception';
import { SnakeCaseInterceptor } from './common/interceptors/snake-case.interceptor';
import * as fs from 'fs'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new ResponseInterceptor(), new SnakeCaseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  // app.useStaticAssets(join(__dirname, '..', 'uploads'), {
  //   prefix: '/uploads',
  // });
  app.enableCors({
    credentials: true,
    origin: '*'
  })
  const config = new DocumentBuilder()
    .setTitle("RShop Api")
    .setDescription('the RShop API description')
    .setVersion('1.0')
    .addTag('RShop')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  fs.writeFileSync('./postman.json', JSON.stringify(document, null, 2));
  SwaggerModule.setup('api/swagger', app, document);
  await app.listen(process.env.PORT ?? 3001);
}

bootstrap();
