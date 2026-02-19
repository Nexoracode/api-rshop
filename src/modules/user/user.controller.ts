import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AccessGuard } from 'src/common/guard/access.guard';
import { RoleGuard } from 'src/common/guard/role.guard';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from 'src/common/enums/role.enum';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiTags } from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';
import { OwnerGuard } from 'src/common/guard/owner.guard';
import { AddressService } from '../address/address.service';
import { CustomRequest } from 'src/common/interfaces/request.interface';
import { CreateAddressDto } from '../address/dto/create-address.dto';
import { UpdateAddressDto } from '../address/dto/update-address.dto';
import { ApiPaginationQuery, FilterOperator, Paginate, Paginated, PaginateQuery, PaginationType } from 'nestjs-paginate';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { RequestUser } from 'src/common/interfaces/request-user.interface';

@ApiTags('02 - 👤 Users')
@Controller('users')
@UseGuards(AccessGuard)
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly addressService: AddressService,
    ) { }

    //user controller
    @Get()
    @UseGuards(RoleGuard)
    @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
    @HttpCode(200)
    @ApiPaginationQuery({
        paginationType: PaginationType.CURSOR,
        relations: ['media', 'addresses'],
        select: ['id', 'firstName', 'lastName', 'avatarUrl', 'phone', 'email', 'isPhoneVerified', 'isActive', 'createdAt', 'updatedAt', 'addresses.id', 'media.id', 'media.url'],
        sortableColumns: ['id', 'firstName', 'email', 'phone'],
        defaultSortBy: [['id', 'DESC']],
        searchableColumns: ['firstName', 'email', 'phone'],
        filterableColumns: {
            isActive: [FilterOperator.EQ],
            createdAt: [FilterOperator.GTE, FilterOperator.LTE]
        }
    })

    findAll(@Paginate() query: PaginateQuery) {
        return this.userService.findAllUser(query);
    }

    @Get('me')
    findMe(@Req() req: CustomRequest) {
        return this.userService.findOneUser(req.user.sub);
    }

    @Get(':id')
    @UseGuards(RoleGuard)
    @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.userService.findOneUser(id);
    }


    @Post()
    @UseGuards(RoleGuard)
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    @HttpCode(201)
    create(@Body() data: CreateUserDto) {
        return this.userService.create(data);
    }

    @Patch(':id')
    @UseGuards(RoleGuard)
    @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
    @HttpCode(200)
    update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateUserDto) {
        return this.userService.update(id, data);
    }

    @Delete(':id')
    @UseGuards(RoleGuard)
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    @HttpCode(200)
    delete(@Param('id', ParseIntPipe) id: number) {
        return this.userService.remove(id);
    }

    @Get('me/addresses')
    findMeAddress(@Req() req: CustomRequest) {
        return this.addressService.findByUserId(req.user.sub);
    }

    @Post('me/addresses')
    createAddressForUser(@Req() req: CustomRequest, @Body() data: CreateAddressDto) {
        return this.addressService.create(req.user.sub, data);
    }

    @Post(':id/addresses')
    @UseGuards(RoleGuard)
    @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
    createAddressForAdmin(@Param('id', ParseIntPipe) id: number, @Body() data: CreateAddressDto) {
        return this.addressService.create(id, data);
    }

    @Patch('me/addresses/:addressId')
    updateUserAddress(@Param('addressId', ParseIntPipe) addressId: number, @Body() data: UpdateAddressDto) {
        return this.addressService.update(addressId, data);
    }

    @Delete('me/addresses/:addressId')
    deleteUserAddress(@Param('addressId', ParseIntPipe) addressId: number) {
        return this.addressService.remove(addressId);
    }

    @Patch('me')
    @UseGuards(AccessGuard)
    updateUserMe(@CurrentUser() user: RequestUser, @Body() data: UpdateUserDto) {
        return this.userService.updateMe(user, data);
    }


}
