import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Support } from './entities/support.entity';
import { Message } from './entities/message.entity';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { SupportAdminController } from './support-admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Support, Message])],
  controllers: [SupportController, SupportAdminController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule { }
