import { Module } from '@nestjs/common';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Province } from './entities/provinces.entity';
import { City } from './entities/cities.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Province, City])],
  controllers: [LocationController],
  providers: [LocationService],
})
export class LocationModule { }
