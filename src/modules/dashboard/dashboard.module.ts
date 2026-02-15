import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { RbacService } from './rbac/rbac.service';
import { RbacController } from './rbac/rbac.controller';
import { User } from '../user/entities/user.entity';
import { Order } from '../order/entities/order.entity';
import { Payment } from '../payment/entities/payment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Order, Payment]),
  ],
  controllers: [
    DashboardController,
    RbacController,
  ],
  providers: [
    DashboardService,
    RbacService,
  ],
  exports: [
    DashboardService,
    RbacService,
  ],
})
export class DashboardModule {}
