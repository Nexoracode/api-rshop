import { PartialType } from "@nestjs/swagger";
import { CreateCategoryAttributeDto } from "./create-category-attribute.dto";

export class UpdateCategoryAttribute extends PartialType(CreateCategoryAttributeDto) { }