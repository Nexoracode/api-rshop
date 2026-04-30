import { Module } from '@nestjs/common';
import { AmadastService } from './amadast.service';
import { AmadastController } from './amadast.controller';
import { SyncService } from './amadast-sync.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Province } from '../location/entities/provinces.entity';
import { City } from '../location/entities/cities.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Province, City])],
  controllers: [AmadastController],
  providers: [AmadastService, SyncService],
})
export class AmadastModule { }
