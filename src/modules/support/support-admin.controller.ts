import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { CreateAdminReplyDto } from './dto/create-admin-reply.dto';
import { RoleGuard } from 'src/common/guard/role.guard';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from 'src/common/enums/role.enum';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { RequestUser } from 'src/common/interfaces/request-user.interface';
import { AccessGuard } from 'src/common/guard/access.guard';

@ApiTags('Admin - Support')
@ApiBearerAuth()
@UseGuards(AccessGuard, RoleGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('admin/support')
export class SupportAdminController {
    constructor(private readonly supportService: SupportService) { }

    // 🟢 لیست همه گفتگوها
    @Get()
    @ApiOperation({ summary: 'دریافت لیست تمام گفتگوها' })
    findAll() {
        return this.supportService.findAllForAdmin();
    }

    // 🟢 جزئیات گفت‌وگو
    @Get(':id')
    @ApiOperation({ summary: 'دریافت جزئیات گفت‌وگو' })
    findOne(@Param('id') id: number) {
        return this.supportService.findOneForAdmin(id);
    }

    // 🟢 پاسخ ادمین به گفت‌وگو
    @Post(':id/reply')
    @ApiOperation({ summary: 'ارسال پاسخ توسط ادمین' })
    adminReply(
        @CurrentUser() admin: RequestUser,
        @Param('id') id: number,
        @Body() dto: CreateAdminReplyDto,
    ) {
        return this.supportService.adminReply(admin, id, dto);
    }
}