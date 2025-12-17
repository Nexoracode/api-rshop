import { PaginateQuery } from "nestjs-paginate";
import { CreateCategoryDto } from "../dto/create-category.dto";
import { UpdateCategoryDto } from "../dto/update-category.dto";
import { Category } from "../entities/category.entity";
import { ICategoryResponse, ICategoryResponseSite } from "./category.response.interface";

export interface ICategoryService {
    findOne(id: number);
    findAllTree(query: PaginateQuery): Promise<Object>;
    findAllTreeForSite(): Promise<ICategoryResponseSite[]>;
    remove(id: number): Promise<Object>;
    findByIdWithDescendants(id: number): Promise<ICategoryResponse>;
    create(data: CreateCategoryDto): Promise<ICategoryResponse>;
    update(id: number, data: UpdateCategoryDto): Promise<ICategoryResponse>;
}
