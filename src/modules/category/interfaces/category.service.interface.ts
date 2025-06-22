import { CreateCategoryDto } from "../dto/create-category.dto";
import { UpdateCategoryDto } from "../dto/update-category.dto";
import { Category } from "../entities/category.entity";
import { ICategoryResponse } from "./category.response.interface";

export interface ICategoryService {
    findOne(id: number): Promise<Category>;
    findAllTree(): Promise<ICategoryResponse[]>;
    remove(id: number): Promise<Record<string, string | null>>;
    findByIdWithDescendants(id: number): Promise<ICategoryResponse>;
    create(data: CreateCategoryDto, file: Express.Multer.File): Promise<ICategoryResponse>;
    update(id: number, data: UpdateCategoryDto): Promise<ICategoryResponse>;
}