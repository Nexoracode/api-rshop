import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import promotionConfig from './config/promotion.config';

// ORM Entities
import { PromotionOrmEntity } from './infrastructure/entities/promotion.orm-entity';
import { PromotionConditionOrmEntity } from './infrastructure/entities/promotion-condition.orm-entity';
import { PromotionActionOrmEntity } from './infrastructure/entities/promotion-action.orm-entity';

// External Entities
import { Product } from '../product/entities/product.entity';
import { User } from '../user/entities/user.entity';
import { Category } from '../category/entities/category.entity';

// Controllers
import { PromotionController } from './interface/http/promotion.controller';
import { PromotionAdminController } from './interface/http/promotion.admin.controller';

// Interfaces
import { PromotionValidator } from './domain/interfaces/promotion-validator.interface';
import { PromotionEngine } from './domain/interfaces/promotion-engine.interface';
import { PromotionRepository } from './domain/interfaces/promotion-repository.interface';
import { SmsProvider } from './domain/interfaces/sms-provider.interface';

// Services
import { PromotionValidatorService } from './domain/services/promotion-validator.service';
import { PromotionEngineService } from './domain/services/promotion-engine.service';
import { SmsSenderService } from './domain/services/sms-sender.service';

// Repository
import { PromotionRepositoryImpl } from './infrastructure/repositories/promotion-repository';

// SMS Provider
import { IppanelSmsProvider } from './infrastructure/sms/ippanel-sms.provider';

// UseCases
import { CreatePromotionUseCase } from './application/usecases/create-promotion.usecase';
import { UpdatePromotionUseCase } from './application/usecases/update-promotion.usecase';
import { DeletePromotionUseCase } from './application/usecases/delete-promotion.usecase';
import { ListPromotionsUseCase } from './application/usecases/list-promotion.usecase';
import { CheckPromotionUseCase } from './application/usecases/check-promotion.usecase';
import { GetPromotionByIdUseCase } from './application/usecases/get-promotion-by-id.usecase';

@Module({
  imports: [
    ConfigModule.forFeature(promotionConfig),
    
    TypeOrmModule.forFeature([
      PromotionOrmEntity,
      PromotionConditionOrmEntity,
      PromotionActionOrmEntity,
      Product,
      User,
      Category,
    ]),
  ],
  controllers: [
    PromotionController,
    PromotionAdminController,
  ],
  providers: [
    {
      provide: PromotionRepository,
      useClass: PromotionRepositoryImpl,
    },
    {
      provide: PromotionValidator,
      useClass: PromotionValidatorService,
    },
    {
      provide: PromotionEngine,
      useClass: PromotionEngineService,
    },
    {
      provide: SmsProvider,
      useClass: IppanelSmsProvider,
    },
    SmsSenderService,
    CreatePromotionUseCase,
    UpdatePromotionUseCase,
    DeletePromotionUseCase,
    ListPromotionsUseCase,
    CheckPromotionUseCase,
    GetPromotionByIdUseCase,
  ],
  exports: [
    PromotionEngine,
    PromotionRepository,
    CheckPromotionUseCase,
  ],
})
export class PromotionModule {}
