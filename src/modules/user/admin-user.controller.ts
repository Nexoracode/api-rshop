import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccessGuard } from 'src/common/guard/access.guard';
import { RoleGuard } from 'src/common/guard/role.guard';
import { UserAdminServices } from './user-admin.service';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { RequestUser } from 'src/common/interfaces/request-user.interface';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from 'src/common/enums/role.enum';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateadminDto } from './dto/update-admin.user.dto';

@ApiTags('🧑 User - Admin')
@Controller('admin/users')
@UseGuards(AccessGuard, RoleGuard)
export class UserAdminController {
  constructor(private readonly userAdminService: UserAdminServices) { }

  /**
   * اطلاعات خود ادمین + دسترسی‌هایش
   * همه نقش‌های غیر USER می‌توانند این endpoint را ببینند
   */
  @Get('me')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT, Role.WERHOUSE_MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'اطلاعات خودم و دسترسی‌هایم' })
  getSelfInfo(@CurrentUser() currentUser: RequestUser) {
    return this.userAdminService.getSelfInfo(currentUser);
  }

  /**
   * لیست تمام نقش‌ها و دسترسی‌هایشان
   * همه نقش‌های ادمینی می‌توانند ببینند
   */
  @Get('roles')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT, Role.WERHOUSE_MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'لیست تمام نقش‌ها و دسترسی‌های هر نقش' })
  getAllRoles() {
    return this.userAdminService.getAllRolesWithPermissions();
  }

  /**
   * لیست تمام ادمین‌ها — فقط SUPER_ADMIN
   */
  @Get('admins')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'لیست تمام کاربران با نقش ادمین (فقط سوپرادمین)' })
  getAdminUsers(@CurrentUser() currentUser: RequestUser) {
    return this.userAdminService.getAdminUsers(currentUser);
  }

  /**
   * ساخت کاربر جدید با نقش مشخص
   * - SUPER_ADMIN: هر نقشی
   * - ADMIN: فقط Manager, Accountant, Staff, Warehouse
   */

  @Get('admins/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'اطلاعات یک ادمین با شناسه مشخص (فقط سوپرادمین)' })
  getAdminById(
    @CurrentUser() currentUser: RequestUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.userAdminService.getAdminByid(currentUser, id);
  }

  @Patch('admins/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'ویرایش اطلاعات یک ادمین با شناسه مشخص (فقط سوپرادمین)' })
  updateAdminById(
    @CurrentUser() currentUser: RequestUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateadminDto,

  ) {
    return this.userAdminService.updateAdminById(currentUser, id, dto);
  }

  @Post('create')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({
    summary: 'ایجاد کاربر با نقش مشخص',
    description:
      'سوپرادمین می‌تواند هر نقشی بسازد. ادمین فقط می‌تواند نقش‌های پایین‌تر (Manager, Accountant, Staff, Warehouse) بسازد.',
  })
  createUserWithRole(
    @CurrentUser() currentUser: RequestUser,
    @Body() dto: CreateAdminUserDto,
  ) {
    return this.userAdminService.createUserWithRole(currentUser, dto);
  }
}
