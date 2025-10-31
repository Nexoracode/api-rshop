import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { UserModule } from '../user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Order } from '../order/entities/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Order])],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule { }
