import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SwaggerUI } from './swagger-ui.class';
import { _SWAGGER_TAGS } from './swagger-tags/swagger-tags.constants';
import * as fs from 'fs'

export class SwaggerDocumentBuilder {
  constructor(private readonly app: INestApplication<any>) { }

  private buildConfig() {
    const docBuilder = new DocumentBuilder()
      .setTitle('RShop APi Document')
      .setDescription('داکیومنت کامل جهت api ')
      .setVersion('1.0')
    _SWAGGER_TAGS.forEach((tag) => {
      docBuilder.addTag(tag.name, tag.description);
    });
    return docBuilder.build();
  }

  private createDocument() {
    const config = this.buildConfig();
    return SwaggerModule.createDocument(this.app, config);
  }

  public setupSwagger() {
    const document = this.createDocument();
    fs.writeFileSync('postman.json', JSON.stringify(document, null, 2));
    const swaggerUI = new SwaggerUI('http://localhost:3001/api');
    SwaggerModule.setup(
      'api/swagger',
      this.app,
      document,
      swaggerUI.customOptions,
    );
  }
}

