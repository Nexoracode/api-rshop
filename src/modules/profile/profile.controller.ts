import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { AccessGuard } from 'src/common/guard/access.guard';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { RequestUser } from 'src/common/interfaces/request-user.interface';

@ApiTags('Profile - Overview')
@ApiBearerAuth()
@UseGuards(AccessGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) { }

  @Get()
  @ApiOperation({ summary: 'دریافت اطلاعات کلی پروفایل کاربر' })
  async getOverview(@CurrentUser() user: RequestUser) {
    return this.profileService.getProfileOverview(user.id);
  }
}
