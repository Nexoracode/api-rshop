import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SepidarService } from './sepidar.service';
import { ApiBody, ApiProperty, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RegisterSepidarDto } from './dto/register-sepidar.dto';
import { LoginSepidarDto } from './dto/login-sepidar.dto';
import { AccessGuard } from 'src/common/guard/access.guard';
import { RoleGuard } from 'src/common/guard/role.guard';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('13 - 🌿 Sepidar')
@ApiBearerAuth()
@Controller('sepidar')
@UseGuards(AccessGuard, RoleGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN)
export class SepidarController {
  constructor(private readonly sepidarService: SepidarService) { }

  @Post('register')
  register() {
    return this.sepidarService.register();
  }

  @Post('login')
  login() {
    return this.sepidarService.login();
  }
}
