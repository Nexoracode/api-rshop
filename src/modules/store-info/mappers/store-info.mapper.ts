import { StoreInfoEntity } from '../entities/store-info.entity';
import { FaqEntity } from '../entities/faq.entity';
import { IFaqResponse, IStoreInfoResponse } from '../interfaces/store-info.interface';

export class StoreInfoMapper {
  static toResponse(entity: StoreInfoEntity): IStoreInfoResponse {
    return {
      id: entity.id,
      type: entity.type,
      title: entity.title,
      content: entity.content,
      metaTitle: entity.metaTitle ?? null,
      metaDescription: entity.metaDescription ?? null,
      isActive: entity.isActive,
      displayOrder: entity.displayOrder,
      createdAt: entity.createdAt?.toISOString(),
      updatedAt: entity.updatedAt?.toISOString(),
    };
  }

  static toFaqResponse(entity: FaqEntity): IFaqResponse {
    return {
      id: entity.id,
      question: entity.question,
      answer: entity.answer,
      category: entity.category ?? null,
      displayOrder: entity.displayOrder,
      isActive: entity.isActive,
      viewCount: entity.viewCount,
      createdAt: entity.createdAt?.toISOString(),
      updatedAt: entity.updatedAt?.toISOString(),
    };
  }
}
