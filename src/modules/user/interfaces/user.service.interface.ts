import { CreateUserDto } from "../dto/create-user.dto";
import { UpdateUserDto } from "../dto/update-user.dto";
import { IUserResponse } from "./user.response.interface";

export interface IUserService {
    create(data: CreateUserDto): Promise<IUserResponse>;
    findOneUser(id: number): Promise<IUserResponse>;
    findAllUser(): Promise<IUserResponse[]>;
    update(id: number, data: UpdateUserDto): Promise<IUserResponse>;
    remove(id: number): Promise<Object>;
}