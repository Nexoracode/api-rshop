import { Media } from 'src/modules/media/entities/image.entity';
import { SupportStatus } from '../entities/support.entity';
import { MessageResponse } from './message.interface';
import { Role } from 'src/common/enums/role.enum';

export interface SupportResponse {
    id: number;
    userId: number;
    productId?: number | null;
    subject: string;
    status: SupportStatus;
    messages?: MessageResponse[];
    createdAt: Date;
    updatedAt: Date;
    product?: {
        id: number;
        title: string;
        price: number;
        image?: Media[] | string;
    } | null;
    user?: {
        id: number;
        name: string;
        phone?: string;
        email?: string;
        role?: Role;
    };
}
