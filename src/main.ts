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
  app.enableCors({
    credentials: true,
    origin: [
      'http://localhost:3000',
      'http://172.18.100.50:3000',
      'http://172.18.100.165:3000',
      'https://app-backend-rshop-nodejs.roohbakhshac.com',
      'https://rshop.roohbakhshac.ir',
      'https://cms.rshop.roohbakhshac.ir',
      'https://app-front-rshop-next.roohbakhshac.com',
      'https://app-front-rshop-next.roohbakhshac.com',
      'https://app-cms-rshop-next.roohbakhshac.com',
      'http://app-backend-rshop-nodejs.roohbakhshac.com',
      'http://rshop.roohbakhshac.ir',
      'http://cms.rshop.roohbakhshac.ir',
      'http://app-front-rshop-next.roohbakhshac.com',
      'http://app-front-rshop-next.roohbakhshac.com',
      'http://app-cms-rshop-next.roohbakhshac.com'
    ]
  })
  app.useGlobalInterceptors(new ResponseSnakeCaseInterceptor(), new SnakeToCamelInterceptor());
  app.setGlobalPrefix('api')
  const swaggerDocumentBuilder = new SwaggerDocumentBuilder(app);
  swaggerDocumentBuilder.setupSwagger();
  await app.listen(process.env.PORT ?? 3000)
}

bootstrap();