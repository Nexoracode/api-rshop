import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { AccessGuard } from 'src/common/guard/access.guard';
import { RoleGuard } from 'src/common/guard/role.guard';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('📊 Dashboard')
@Controller('admin/dashboard')
@UseGuards(AccessGuard, RoleGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT)
  @ApiOperation({
    summary: 'آمار داشبورد — بازدید، فروش کل، سفارش‌ها، مشتری‌های جدید',
    description:
      'داده‌های ماهانه ۱۲ ماه سال شمسی جاری را برمی‌گرداند. هر بخش آرایه‌ای از ۱۲ آیتم با فرمت {id, month, slug, value} دارد.',
  })
  getStats() {
    return this.dashboardService.getDashboardStats();
  }
}
