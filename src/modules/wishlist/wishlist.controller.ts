import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { AccessGuard } from 'src/common/guard/access.guard';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { RequestUser } from 'src/common/interfaces/request-user.interface';

@ApiTags('Profile - Wishlist')
@ApiBearerAuth()
@UseGuards(AccessGuard)
@Controller('profile/wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) { }

  @Get()
  getAll(@CurrentUser() user: RequestUser) {
    return this.wishlistService.getAll(user);
  }

  @Post()
  add(@CurrentUser() user: RequestUser, @Body() dto: CreateWishlistDto) {
    return this.wishlistService.add(user, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: RequestUser, @Param('id') id: number) {
    return this.wishlistService.remove(user, id);
  }
}
