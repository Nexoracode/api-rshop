import { Role } from "src/common/enums/role.enum";

export interface IAuthResponse {
    id: number;
    firstName: string;
    lastName: string;
    role: Role,
    email: string;
    phone: string;
    createdAt: Date;
    lastLoginAt: Date;
}