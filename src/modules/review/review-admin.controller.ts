import { Controller, Get, Param, Put, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { UpdateReviewStatusDto } from './dto/update-review-status.dto';
import { RoleGuard } from 'src/common/guard/role.guard';
import { Role } from 'src/common/enums/role.enum';
import { Roles } from 'src/common/decorator/role.decorator';
import { AccessGuard } from 'src/common/guard/access.guard';

@ApiTags('Admin - Reviews')
@ApiBearerAuth('access-token')
@UseGuards(AccessGuard, RoleGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('admin/reviews')
export class ReviewAdminController {
    constructor(private readonly reviewService: ReviewService) { }

    @Get()
    findAll() {
        return this.reviewService.findAllForAdmin();
    }

    @Put(':id/status')
    updateStatus(@Param('id') id: number, @Body() dto: UpdateReviewStatusDto) {
        return this.reviewService.updateStatus(id, dto);
    }
}
