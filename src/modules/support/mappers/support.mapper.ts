import { Support } from '../entities/support.entity';
import { SupportResponse } from '../interfaces/support.interface';
import { MessageMapper } from './message.mapper';

export class SupportMapper {
    static toResponse(entity: Support): SupportResponse {
        const length = entity.messages.length;
        return {
            id: entity.id,
            userId: entity.userId,
            productId: entity.productId,
            subject: entity.subject,
            status: entity.status,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            product: entity.product
                ? {
                    id: entity.product.id,
                    title: entity.product.name,
                    price: entity.product.price,
                    image: entity.product.mediaPinned?.url
                }
                : null,
            messages: entity.messages
                ? entity.messages.map((m) => MessageMapper.toResponse(m))
                : [],

        };
    }

    static toListResponse(entity: Support): SupportResponse {
        const lastMessage =
            entity.messages && entity.messages.length
                ? entity.messages[entity.messages.length - 1]
                : null;

        return {
            id: entity.id,
            userId: entity.userId,
            productId: entity.productId,
            subject: entity.subject,
            status: entity.status,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,

            product: entity.product
                ? {
                    id: entity.product.id,
                    title: entity.product.name,
                    price: entity.product.price,
                    image: entity.product.mediaPinned?.url,
                }
                : null,

            // 🔥 فقط آخرین پیام
            messages: lastMessage ? [MessageMapper.toResponse(lastMessage)] : [],
        };
    }

    static toList(entities: Support[]): SupportResponse[] {
        return entities.map(suport => this.toListResponse(suport));
    }
}
