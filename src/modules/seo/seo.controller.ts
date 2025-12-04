import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { SeoService } from './seo.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('SEO')
@Controller()
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  @Get('robots.txt')
  @ApiOperation({ summary: 'دریافت فایل robots.txt' })
  getRobotsTxt(@Res() res: Response) {
    const robotsTxt = `User-agent: *
Allow: /
Disallow: /api/admin/
Disallow: /api/auth/
Disallow: /uploads/temp/

# Sitemap
Sitemap: ${process.env.FRONTEND_URL || 'https://yourdomain.com'}/sitemap.xml

# Crawl-delay
Crawl-delay: 1
`;
    res.type('text/plain');
    res.send(robotsTxt);
  }

  @Get('sitemap.xml')
  @ApiOperation({ summary: 'دریافت sitemap' })
  async getSitemap(@Res() res: Response) {
    const sitemap = await this.seoService.generateSitemap();
    res.type('application/xml');
    res.send(sitemap);
  }
}
