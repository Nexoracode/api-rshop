import { Support } from '../entities/support.entity';
import { SupportResponse } from '../interfaces/support.interface';
import { MessageMapper } from './message.mapper';

export class SupportMapper {
    static toResponse(entity: Support): SupportResponse {
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
                : undefined,
            messages: entity.messages
                ? entity.messages.map((m) => MessageMapper.toResponse(m))
                : [],

        };
    }
}
