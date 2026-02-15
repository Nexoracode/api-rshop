import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { RbacService } from './rbac.service';
import { AccessGuard } from 'src/common/guard/access.guard';
import { RoleGuard } from 'src/common/guard/role.guard';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from 'src/common/enums/role.enum';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { RequestUser } from 'src/common/interfaces/request-user.interface';

@ApiTags('📊 Dashboard - RBAC')
@Controller('admin/rbac')
@UseGuards(AccessGuard, RoleGuard)
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  /**
   * دریافت RBAC خود کاربر لاگین‌شده
   * → CMS پس از لاگین این رو صدا می‌زند تا sidebar و permissions رو بسازه
   */
  @Get('me')
  @Roles(
    Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER,
    Role.ACCOUNTANT, Role.WERHOUSE_MANAGER, Role.STAFF,
  )
  @ApiOperation({
    summary: 'دریافت RBAC کاربر لاگین‌شده (sidebar + permissions)',
    description:
      'این endpoint پس از لاگین صدا زده می‌شود. نقش کاربر را می‌خواند و sidebar فیلترشده + لیست دسترسی‌ها را برمی‌گرداند.',
  })
  getMyRbac(@CurrentUser() user: RequestUser) {
    return this.rbacService.getRbacForRole(user.role as Role);
  }

  /**
   * دریافت sidebar یک نقش مشخص
   * فقط SUPER_ADMIN و ADMIN می‌توانند نقش دیگران را ببینند
   */
  @Get('sidebar/:role')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'دریافت sidebar یک نقش (ادمین)' })
  @ApiParam({
    name: 'role',
    enum: Role,
    description: 'نقش مورد نظر',
    example: Role.MANAGER,
  })
  getSidebarForRole(@Param('role') role: Role) {
    return {
      role,
      sidebar: this.rbacService.getSidebarForRole(role),
    };
  }

  /**
   * دریافت دسترسی‌های یک نقش مشخص
   */
  @Get('permissions/:role')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'دریافت permissions یک نقش (ادمین)' })
  @ApiParam({
    name: 'role',
    enum: Role,
    description: 'نقش مورد نظر',
    example: Role.ACCOUNTANT,
  })
  getPermissionsForRole(@Param('role') role: Role) {
    return {
      role,
      permissions: this.rbacService.getPermissionsForRole(role),
    };
  }

  /**
   * خلاصه همه نقش‌ها برای صفحه مدیریت ادمین‌ها
   * فقط SUPER_ADMIN
   */
  @Get('roles/all')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'لیست همه نقش‌ها با دسترسی‌هایشان (سوپرادمین)',
    description: 'برای صفحه مدیریت نقش‌ها استفاده می‌شود. خلاصه دسترسی هر نقش را نشان می‌دهد.',
  })
  getAllRoles() {
    return this.rbacService.getAllRolesSummary();
  }
}
