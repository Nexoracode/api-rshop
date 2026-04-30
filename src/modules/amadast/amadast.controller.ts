import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { AmadastService } from './amadast.service';

@Controller('amadast')
export class AmadastController {
  constructor(private readonly amadastService: AmadastService) { }

  @Get('getToken')
  async getToken() {
    return this.amadastService.getToken();
  }

  @Get('getProvince')
  async getProvince() {
    return this.amadastService.getProvince();
  }

  @Get('getCities')
  async getCities(@Query('province_id') provinceId: string) {
    return this.amadastService.getCities(provinceId);
  }

  @Post('createOrder')
  async createOrder() {
    return this.amadastService.createOrder();
  }
}
