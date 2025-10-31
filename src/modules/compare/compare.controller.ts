import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CompareService } from './compare.service';
import { AddCompareDto } from './dto/add-compare.dto';
import { AccessGuard } from 'src/common/guard/access.guard';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { RequestUser } from 'src/common/interfaces/request-user.interface';

@ApiTags('Profile - Compare')
@ApiBearerAuth()
@UseGuards(AccessGuard)
@Controller('profile/compare')
export class CompareController {
  constructor(private readonly compareService: CompareService) { }

  @Post()
  @ApiOperation({ summary: 'افزودن محصول به مقایسه' })
  add(@CurrentUser() user: RequestUser, @Body() dto: AddCompareDto) {
    return this.compareService.add(user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'دریافت لیست مقایسه محصولات' })
  getAll(@CurrentUser() user: RequestUser) {
    return this.compareService.getAll(user);
  }

  @Delete(':productId')
  @ApiOperation({ summary: 'حذف محصول از مقایسه' })
  remove(@CurrentUser() user: RequestUser, @Param('productId') productId: number) {
    return this.compareService.remove(user, productId);
  }
}
