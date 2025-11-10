import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ResponseSnakeCaseInterceptor } from './common/interceptors/response.interceptor';
import { SnakeToCamelInterceptor } from './common/interceptors/snake-case.interceptor';
import { SwaggerDocumentBuilder } from './swagger/swagger-document-builder';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // const importer = app.get(CatalogImportService);
  // await importer.run();
  // await app.close;
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));
  app.useGlobalInterceptors(new ResponseSnakeCaseInterceptor(), new SnakeToCamelInterceptor());
  app.setGlobalPrefix('api')
  app.enableCors({
    credentials: true,
    origin: [
      'http://localhost:3001',
      'http://localhost:3000',
      'http://172.18.100.42:3001',
      'http://172.18.100.42:3002',
    ]
  })
  const swaggerDocumentBuilder = new SwaggerDocumentBuilder(app);
  swaggerDocumentBuilder.setupSwagger();
  await app.listen(process.env.PORT ?? 3001)
}

bootstrap();