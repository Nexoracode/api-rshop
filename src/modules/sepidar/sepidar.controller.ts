import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SepidarService } from './sepidar.service';
import { ApiBody, ApiProperty, ApiTags } from '@nestjs/swagger';
import { RegisterSepidarDto } from './dto/register-sepidar.dto';
import { LoginSepidarDto } from './dto/login-sepidar.dto';
@ApiTags('13 - 🌿 Sepidar')
@Controller('sepidar')
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
