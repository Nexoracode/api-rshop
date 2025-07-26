import { User } from "src/modules/user/entities/user.entity";
import { IAuthResponse } from "../interfaces/auth-response.interface";

export class AuthMapper {
    static toResponse(user: User): IAuthResponse {
        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
        }
    }
}