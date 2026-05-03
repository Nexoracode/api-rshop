import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import cookieParser = require('cookie-parser');
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ResponseSnakeCaseInterceptor } from './common/interceptors/response.interceptor';
import { SnakeToCamelInterceptor } from './common/interceptors/snake-case.interceptor';
import { SwaggerDocumentBuilder } from './swagger/swagger-document-builder';
import { AllExceptionsFilter } from './common/interceptors/http-exception';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule,
    {
      logger: process.env.NODE_ENV === 'production' ? [
        'warn', 'error'
      ] : ['warn', 'error', 'debug', 'log', 'verbose']
    }
  );
  // const importer = app.get(CatalogImportService);
  // await importer.run();
  // await app.close;
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.use(cookieParser());
  app.useGlobalFilters(new AllExceptionsFilter()),
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }));
  app.enableCors({
    credentials: true,
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
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
      'http://app-cms-rshop-next.roohbakhshac.com',
      'https://edge.ippanel.com',
      'https://api2.ippanel.com'
    ]
  })
  app.useGlobalInterceptors(new ResponseSnakeCaseInterceptor(), new SnakeToCamelInterceptor());
  // ✅ Graceful Shutdown
  app.enableShutdownHooks();

  // ✅ Handle signals
  process.on('SIGTERM', async () => {
    logger.warn('⚠️ SIGTERM signal received: closing HTTP server');
    await app.close();
  });
  app.setGlobalPrefix('api');
  const swaggerDocumentBuilder = new SwaggerDocumentBuilder(app);
  swaggerDocumentBuilder.setupSwagger();
  await app.listen(process.env.PORT || 3001).then(() => {
    logger.log(`🚀 Application is running on: ${process.env.PORT}`);
  });
}

bootstrap();