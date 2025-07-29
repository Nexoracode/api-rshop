import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SepidarService } from './sepidar.service';
import { CreateSepidarDto } from './dto/create-sepidar.dto';
import { UpdateSepidarDto } from './dto/update-sepidar.dto';

@Controller('sepidar')
export class SepidarController {
  constructor(private readonly sepidarService: SepidarService) { }

  @Get()
  register() {
    return this.sepidarService.register();
  }

  @Get('login')
  login() {
    return this.sepidarService.login();
  }
}
