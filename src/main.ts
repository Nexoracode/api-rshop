import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { SnakeCaseInterceptor } from './common/interceptors/snake-case.interceptor';
import { SwaggerDocumentBuilder } from './swagger/swagger-document-builder';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new ResponseInterceptor(), new SnakeCaseInterceptor());
  app.enableCors({
    credentials: true,
    origin: '*'
  })
  const swaggerDocumentBuilder = new SwaggerDocumentBuilder(app);
  swaggerDocumentBuilder.setupSwagger();
  await app.listen(process.env.PORT ?? 3001);
}

bootstrap();
