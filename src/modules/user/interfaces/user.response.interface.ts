import { Role } from "src/common/enums/role.enum";

export interface IUserResponse {
    id: number;
    avatar_url: string;
    firstName: string;
    lastName: string;
    phone: string;
    isPhoneVerified: boolean;
    email: string;
    role?: Role;
    isActive: boolean;
    avatarUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}