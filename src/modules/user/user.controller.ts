import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AccessGuard } from 'src/common/guard/access.guard';
import { RoleGuard } from 'src/common/guard/role.guard';
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
@ApiTags('02 - 👤 Users')
@Controller('users')
@UseGuards(AccessGuard, RoleGuard)
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly addressService: AddressService,
    ) { }

    //user controller
    @Get()
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
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.userService.findOneUser(id);
    }


    @Post()
    @HttpCode(201)
    create(@Body() data: CreateUserDto) {
        return this.userService.create(data);
    }

    @Patch(':id')
    @HttpCode(200)
    update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateUserDto) {
        return this.userService.update(id, data);
    }

    @Delete(':id')
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
    createAddressForAdmin(@Param('id', ParseIntPipe) id: number, @Body() data: CreateAddressDto) {
        return this.addressService.create(id, data);
    }

    @Patch('me/addresses/:addressId')
    updateUserAddress(@Param('addressId', ParseIntPipe) addressId: number, @Body() data: UpdateAddressDto) {
        console.log('Updating address:', addressId, data);
        return this.addressService.update(addressId, data);
    }

    @Delete('me/addresses/:addressId')
    deleteUserAddress(@Param('addressId', ParseIntPipe) addressId: number) {
        return this.addressService.remove(addressId);
    }


}
