import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HomePageService } from '../home-page.service';
import { HomePageDataResponseDto } from '../dto/home-page-response.dto';
import { Public } from 'src/common/decorator/public.decorator';
import { HomeSectionService } from '../home-section.service';
import { Role } from 'src/common/enums/role.enum';
import { AccessGuard } from 'src/common/guard/access.guard';
import { RoleGuard } from 'src/common/guard/role.guard';

@ApiTags('Home Page - Public')
@Controller('home')
@Public()
export class HomePagePublicController {
  constructor(
    private readonly homePageService: HomePageService,
    private readonly homeSectionService: HomeSectionService,
  ) { }

  @Get()
  @Public()
  @ApiOperation({
    summary: 'دریافت تمام داده‌های صفحه اصلی',
    description: `
این API تمام اطلاعات مورد نیاز برای نمایش صفحه اصلی را برمی‌گرداند شامل:
- اسلایدرهای اصلی (Hero Sliders)
- بنرهای کناری (Side Banners) 
- دسته‌بندی‌های اصلی (Categories)
- بخش‌های مختلف محصولات (Home Sections)

**نکته مهم:** این API از کش استفاده می‌کند و هر 5 دقیقه یکبار بروزرسانی می‌شود.
    `.trim()
  })
  @ApiResponse({
    status: 200,
    description: 'داده‌های صفحه اصلی با موفقیت دریافت شد',
    type: HomePageDataResponseDto,
  })

  async getHomePage() {
    return await this.homePageService.getHomePageData(false);
  }

  @Get('admin')
  @Public()
  @ApiOperation({
    summary: 'دریافت تمام داده‌های صفحه اصلی برای ادمین',
  })
  @ApiResponse({
    status: 200,
    description: 'داده‌های صفحه اصلی با موفقیت دریافت شد',
    type: HomePageDataResponseDto,
  })

  async getHomePageAdmin() {
    return await this.homePageService.getHomePageData(true);
  }

  @Get('collection/:slug')
  @Public()
  async getOneBySlug(@Query('slug') slug: string) {
    return this.homeSectionService.findBySlug(slug);
  }

  @Get('collection/:slug/products')
  @Public()
  async getproductBySectionSlug(@Query('slug') slug: string) {
    return this.homeSectionService.findProductBySectionSlug(slug);
  }

  @Get('dashboard')
  @UseGuards(AccessGuard, RoleGuard)
  async getDataForDashboard() {
    return this.homePageService.getDataForDashobard();
  }
}
