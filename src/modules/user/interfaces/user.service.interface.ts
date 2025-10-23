import { PaginateQuery } from "nestjs-paginate";
import { CreateUserDto } from "../dto/create-user.dto";
import { UpdateUserDto } from "../dto/update-user.dto";
import { IUserResponse } from "./user.response.interface";
import { Request } from "express";
export interface IUserService {
    create(data: CreateUserDto): Promise<IUserResponse>;
    findOneUser(id: number): Promise<IUserResponse>;
    findAllUser(query: PaginateQuery): Promise<Object>;
    update(id: number, data: UpdateUserDto): Promise<IUserResponse>;
    remove(id: number): Promise<Object>;
}