import { SWAGGER_UI_CONSTANTS } from './constants/swagger-ui.constants';

export class SwaggerUI {
  constructor(private readonly applicationUrl: string) { }

  private customSiteTitle = 'مستندات API فروشگاه';
  private faviconFilename = 'nestjs-logo.png';
  private topbarIconFilename = 'app-logo.png';

  private customfavIcon: string = `${this.applicationUrl}/wwwroot/swagger/assets/${this.faviconFilename}`;
  private customCss: string = `
  .topbar { display: none } /* حذف نوار بالایی */
    .swagger-ui .info { margin: 30px 0; }
    .swagger-ui .scheme-container { display: none; }

    body {
      font-family: 'Vazirmatn', sans-serif !important;
    }

    .swagger-ui {
      background-color: #fefefe;
    }

    .swagger-ui .opblock.opblock-post{
      border-left: 5px solid #4CAF50;
    }

    .swagger-ui .opblock.opblock-get {
      border-left: 5px solid #2196F3;
    }

    .swagger-ui .opblock.opblock-delete {
      border-left: 5px solid #f44336;
    }

    .swagger-ui .opblock.opblock-put {
      border-left: 5px solid #FF9800;
    }

    .swagger-ui .btn.authorize {
      background-color: #673AB7;
      color: white;
    }`;

  private swaggerOptions = {
    docExpansion: 'none',
    persistAuthorization: true,
  };

  public customOptions = {
    customfavIcon: this.customfavIcon,
    customSiteTitle: this.customSiteTitle,
    customCss: this.customCss,
    swaggerOptions: this.swaggerOptions,
  };
}
