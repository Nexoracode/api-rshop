import { Body, Controller, Param, ParseIntPipe, Patch, Post, UseGuards } from "@nestjs/common";
import { AddressService } from "./address.service";
import { ApiTags } from "@nestjs/swagger";
import { CreateAddressDto } from "./dto/create-address.dto";
import { AccessGuard } from "src/common/guard/access.guard";
import { RoleGuard } from "src/common/guard/role.guard";
import { Roles } from "src/common/decorator/role.decorator";
import { Role } from "src/common/enums/role.enum";
import { UpdateAddressDto } from "./dto/update-address.dto";

@Controller('addresses')
@ApiTags('Addresses')
@UseGuards(AccessGuard, RoleGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.SUPER_ADMIN)
export class AddressControllerAdmin {
    constructor(
        private readonly addressService: AddressService
    ) { }
    @Post(':user_id/add')
    async adddedAddress(@Param('user_id', ParseIntPipe) id: number, @Body() data: CreateAddressDto) {
        return this.addressService.create(id, data);
    }

    @Patch(':id/update')
    async updateAddress(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateAddressDto) {
        return this.addressService.update(id, data);
    }
}