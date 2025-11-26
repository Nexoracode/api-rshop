import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// ORM Entities
import { PromotionOrmEntity } from './infrastructure/entities/promotion.orm-entity';
import { PromotionConditionOrmEntity } from './infrastructure/entities/promotion-condition.orm-entity';
import { PromotionActionOrmEntity } from './infrastructure/entities/promotion-action.orm-entity';

// Controllers
import { PromotionController } from './interface/http/promotion.controller';
import { PromotionAdminController } from './interface/http/promotion.admin.controller';

// Validators & Engine
import { PromotionValidator } from './domain/interfaces/promotion-validator.interface';
import { PromotionValidatorService } from './domain/services/promotion-validator.service';
import { PromotionEngine } from './domain/interfaces/promotion-engine.interface';
import { PromotionEngineService } from './domain/services/promotion-engine.service';

// Repository
import { PromotionRepositoryImpl } from './infrastructure/repositories/promotion-repository';

// UseCases
import { CreatePromotionUseCase } from './application/usecases/create-promotion.usecase';
import { UpdatePromotionUseCase } from './application/usecases/update-promotion.usecase';
import { DeletePromotionUseCase } from './application/usecases/delete-promotion.usecase';
import { ListPromotionsUseCase } from './application/usecases/list-promotion.usecase';
import { CheckPromotionUseCase } from './application/usecases/check-promotion.usecase';

// SMS Provider
import { SmsProvider } from './domain/interfaces/sms-provider.interface';
import { IppanelSmsProvider } from './infrastructure/sms/ippanel-sms.provider';
import { SmsSenderService } from './domain/services/sms-sender.service';
import { PromotionRepository } from './domain/interfaces/promotion-repository.interface';
import { GetPromotionByIdUseCase } from './application/usecases/get-promotion-by-id.usecase';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PromotionOrmEntity,
      PromotionConditionOrmEntity,
      PromotionActionOrmEntity,
    ]),
  ],
  controllers: [
    PromotionController,
    PromotionAdminController,
  ],
  providers: [
    // Repo Bind
    {
      provide: PromotionRepository,
      useClass: PromotionRepositoryImpl,
    },

    // Validator Engine
    {
      provide: PromotionValidator,
      useClass: PromotionValidatorService,
    },
    {
      provide: PromotionEngine,
      useClass: PromotionEngineService,
    },

    // SMS Provider
    {
      provide: SmsProvider,
      useClass: IppanelSmsProvider,
    },

    SmsSenderService,

    // Use cases
    CreatePromotionUseCase,
    UpdatePromotionUseCase,
    DeletePromotionUseCase,
    ListPromotionsUseCase,
    CheckPromotionUseCase,
    GetPromotionByIdUseCase
  ],

  exports: [PromotionEngine, PromotionRepository],
})
export class PromotionModule { }
