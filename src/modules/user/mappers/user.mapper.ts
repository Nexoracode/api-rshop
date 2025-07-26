import { User } from "../entities/user.entity";
import { IUserResponse } from "../interfaces/user.response.interface";

export class UserMapper {
    static toResponse(user: User): IUserResponse {
        return {
            id: user.id,
            avatar_url: user.avatarUrl || "",
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            email: user.email,
            isPhoneVerified: user.isPhoneVerified,
            isActive: user.isActive,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }
    }
}