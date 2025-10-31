import { Message } from '../entities/message.entity';
import { MessageResponse } from '../interfaces/message.interface';

export class MessageMapper {
    static toResponse(entity: Message): MessageResponse {
        const name = `${entity.sender.firstName} ${entity.sender.lastName}`.trim();
        return {
            id: entity.id,
            senderId: entity.senderId,
            content: entity.content,
            createdAt: entity.createdAt,
            sender: entity.sender
                ? {
                    id: entity.sender.id,
                    name: entity.sender.firstName === null ? 'کاربر سایت' : name,
                    phone: entity.sender.phone,
                    role: entity.sender.role,
                }
                : undefined,
        };
    }
}
