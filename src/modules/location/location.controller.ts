import { Controller, Get, Param } from '@nestjs/common';
import { LocationService } from './location.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) { }

  @Get('provinces')
  async provincesAll() {
    return this.locationService.provincesAll();
  }

  @Get('city/:province_id')
  async cityProvince(@Param('province_id') id: string) {
    console.log('provice')
    return this.locationService.cityByProvince(+id);
  }
}
