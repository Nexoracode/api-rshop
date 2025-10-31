import { Role } from "src/common/enums/role.enum";

export interface MessageResponse {
    id: number;
    senderId: number;
    content: string;
    createdAt: Date;
    sender?: {
        id: number;
        name: string;
        phone: string;
        role: Role;
    };
}
