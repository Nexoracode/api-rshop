import { PartialType } from "@nestjs/swagger";
import { CreateHelperDto } from "./create-helper.dto";

export class UpdateHelperDto extends PartialType(CreateHelperDto) { }