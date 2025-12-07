import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    ParseIntPipe,
    Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AccountService } from '../services/account.service';
import { CreateAccountDto, UpdateAccountDto } from '../dto/account.dto';
import { AccessGuard } from 'src/common/guard/access.guard';
import { RoleGuard } from 'src/common/guard/role.guard';
import { Role } from 'src/common/enums/role.enum';
import { Roles } from 'src/common/decorator/role.decorator';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { User } from 'src/modules/user/entities/user.entity';

@ApiTags('Accounting - Accounts')
@ApiBearerAuth()
@UseGuards(AccessGuard, RoleGuard)
@Controller('accounting/accounts')
export class AccountController {
    constructor(private readonly accountService: AccountService) { }

    @Post()
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'ایجاد حساب جدید' })
    async create(@Body() createDto: CreateAccountDto, @CurrentUser() user: User) {
        return this.accountService.create(createDto, user.id);
    }

    @Get()
    @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.ACCOUNTANT)
    @ApiOperation({ summary: 'لیست حساب‌ها' })
    async findAll(@Query('isActive') isActive?: boolean) {
        return this.accountService.findAll(isActive);
    }

    @Get('default')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.ACCOUNTANT)
    @ApiOperation({ summary: 'دریافت حساب پیش‌فرض' })
    async getDefault() {
        return this.accountService.getDefaultAccount();
    }

    @Get(':id')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.ACCOUNTANT)
    @ApiOperation({ summary: 'دریافت حساب' })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.accountService.findOne(id);
    }

    @Get(':id/balance')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.ACCOUNTANT)
    @ApiOperation({ summary: 'دریافت موجودی حساب' })
    async getBalance(@Param('id', ParseIntPipe) id: number) {
        return this.accountService.getBalance(id);
    }

    @Patch(':id')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'بروزرسانی حساب' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdateAccountDto,
    ) {
        return this.accountService.update(id, updateDto);
    }

    @Delete(':id')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'حذف حساب' })
    async remove(@Param('id', ParseIntPipe) id: number) {
        return this.accountService.remove(id);
    }
}