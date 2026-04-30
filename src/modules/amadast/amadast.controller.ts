import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { AmadastService } from './amadast.service';
import { SyncService } from './amadast-sync.service';

@Controller('amadast')
export class AmadastController {
  constructor(
    private readonly amadastService: AmadastService,
    private readonly syncService: SyncService,
  ) { }

  @Get('sync')
  async sync() {
    return this.syncService.syncAllProvincesAndCities();
  }

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
