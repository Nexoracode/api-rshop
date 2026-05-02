import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Province } from './entities/provinces.entity';
import { Repository } from 'typeorm';
import { City } from './entities/cities.entity';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Province)
    private readonly provinceRepo: Repository<Province>,
    @InjectRepository(City)
    private readonly cityRepo: Repository<City>
  ) { }

  async provincesAll() {
    const province = await this.provinceRepo.find({
      select: ['id', 'title', 'location']
    });
    return province;
  }

  async cityByProvince(provinceId: number) {
    const city = await this.cityRepo.find({
      where: { provinceId },
      select: ['id', 'title', 'cityId', 'location']
    })
    return city;
  }
}
