import { Role } from "../enums/role.enum";

export interface RequestUser {
    id: number;
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    role?: Role;
}