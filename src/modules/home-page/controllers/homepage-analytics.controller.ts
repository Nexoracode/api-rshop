import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { HomePageAnalyticsService } from '../homepage-analytics.service';
import { ClickElementType } from '../entities/homepage-click-analytics.entity';
import { Request } from 'express';
import { AccessGuard } from 'src/common/guard/access.guard';
import { RoleGuard } from 'src/common/guard/role.guard';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('Home Page - Analytics')
@Controller('home/analytics')
export class HomePageAnalyticsController {
  constructor(
    private readonly analyticsService: HomePageAnalyticsService,
  ) { }

  @Post('track/:type/:id')
  @ApiOperation({
    summary: 'ثبت کلیک روی اسلایدر یا بنر',
    description: 'این API برای ترک کردن کلیک‌های کاربران روی اسلایدرها و بنرها استفاده می‌شود'
  })
  @ApiResponse({ status: 201, description: 'کلیک با موفقیت ثبت شد' })
  async trackClick(
    @Param('type') type: ClickElementType,
    @Param('id') id: string,
    @Req() request: Request,
  ) {
    const userIp = request.ip || request.headers['x-forwarded-for'] as string;
    const userAgent = request.headers['user-agent'];

    await this.analyticsService.trackClick(
      type,
      +id,
      userIp,
      userAgent || '',
    );

    return { message: 'Click tracked successfully' };
  }

  @Get('sliders')
  @UseGuards(AccessGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'دریافت آمار کلیک‌های تمام اسلایدرها' })
  @ApiResponse({ status: 200, description: 'آمار کلیک‌ها' })
  async getSlidersStats() {
    return await this.analyticsService.getAllSlidersStats();
  }

  @Get('banners')
  @UseGuards(AccessGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'دریافت آمار کلیک‌های تمام بنرها' })
  @ApiResponse({ status: 200, description: 'آمار کلیک‌ها' })
  async getBannersStats() {
    return await this.analyticsService.getAllBannersStats();
  }

  @Get(':type/:id')
  @UseGuards(AccessGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'دریافت آمار کلیک‌های یک عنصر' })
  @ApiResponse({ status: 200, description: 'آمار کلیک‌ها' })
  async getElementStats(
    @Param('type') type: ClickElementType,
    @Param('id') id: string,
  ) {
    return await this.analyticsService.getElementStats(type, +id);
  }

  @Get(':type/:id/range')
  @UseGuards(AccessGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'دریافت آمار کلیک‌ها در بازه زمانی' })
  @ApiQuery({ name: 'start', description: 'تاریخ شروع (YYYY-MM-DD)' })
  @ApiQuery({ name: 'end', description: 'تاریخ پایان (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'آمار کلیک‌ها' })
  async getStatsInRange(
    @Param('type') type: ClickElementType,
    @Param('id') id: string,
    @Query('start') startDate: string,
    @Query('end') endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return await this.analyticsService.getStatsInDateRange(
      type,
      +id,
      start,
      end,
    );
  }
}
