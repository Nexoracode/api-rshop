import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AddressModule } from '../address/address.module';
import { UserAdminController } from './admin-user.controller';
import { UserAdminServices } from './user-admin.service';
import { RoleGuard } from 'src/common/guard/role.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    AddressModule,
  ],
  providers: [UserService, UserAdminServices, RoleGuard],
  controllers: [UserController, UserAdminController],
  exports: [UserService, UserAdminServices],
})
export class UserModule { }
