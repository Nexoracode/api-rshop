import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { RecentViewService } from './recent-view.service';
import { CreateRecentViewDto } from './dto/create-recent-view.dto';
import { AccessGuard } from 'src/common/guard/access.guard';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { RequestUser } from 'src/common/interfaces/request-user.interface';

@ApiTags('Profile - Recent Views')
@ApiBearerAuth()
@UseGuards(AccessGuard)
@Controller('profile/recent-views')
export class RecentViewController {
  constructor(private readonly recentViewService: RecentViewService) { }

  @Get()
  getAll(@CurrentUser() user: RequestUser) {
    return this.recentViewService.getAll(user);
  }

  @ApiOperation({ summary: 'هنگام بازدید از محصول فراخوانی شود.' })
  @Post()
  add(@CurrentUser() user: RequestUser, @Body() dto: CreateRecentViewDto) {
    return this.recentViewService.add(user, dto);
  }
}
