import { Module } from '@nestjs/common';
import { AddressService } from './address.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Address } from './entities/address.entity';
import { User } from '../user/entities/user.entity';
import { AddressControllerAdmin } from './address.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Address, User])],
  providers: [AddressService],
  controllers: [AddressControllerAdmin],
  exports: [AddressService]
})
export class AddressModule { }
