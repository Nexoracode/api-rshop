import { Module } from '@nestjs/common';
import { IconService } from './icon.service';
import { IconController } from './icon.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Icon } from './entities/icon.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Icon])
  ],
  controllers: [IconController],
  providers: [IconService],
})
export class IconModule { }
