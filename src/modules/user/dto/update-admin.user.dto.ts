import { PartialType } from "@nestjs/swagger";
import { CreateAdminUserDto } from "./create-admin-user.dto";

export class UpdateadminDto extends PartialType(CreateAdminUserDto) { }