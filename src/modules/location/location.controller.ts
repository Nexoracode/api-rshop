import { Controller, Get, Param } from '@nestjs/common';
import { LocationService } from './location.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Public } from 'src/common/decorator/public.decorator';

@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) { }

  @Public()
  @Get('provinces')
  async provincesAll() {
    return this.locationService.provincesAll();
  }

  @Public()
  @Get('city/:province_id')
  async cityProvince(@Param('province_id') id: string) {
    return this.locationService.cityByProvince(+id);
  }
}
