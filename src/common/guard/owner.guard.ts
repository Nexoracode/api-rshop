import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "../enums/role.enum";
import { CustomRequest } from "../interfaces/request.interface";

@Injectable()
export class OwnerGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<CustomRequest>();
        const user = request.user;

        const paramId = Number(request.params.id);
        if (!user) {
            throw new ForbiddenException('Unauthorized');
        }
        if (user.role === Role.ADMIN, Role.SUPER_ADMIN || user.role === Role.SUPER_ADMIN) {
            return true;
        }
        if (user.sub === paramId) {
            return true;
        }

        throw new ForbiddenException('Access denied: not owner');
    }
}