import { Controller, Get, Param, Put, Body, UseGuards, Patch, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { UpdateReviewStatusDto } from './dto/update-review-status.dto';
import { RoleGuard } from 'src/common/guard/role.guard';
import { Role } from 'src/common/enums/role.enum';
import { Roles } from 'src/common/decorator/role.decorator';
import { AccessGuard } from 'src/common/guard/access.guard';
import { ApiPaginationQuery, FilterOperator, Paginate, PaginateQuery, PaginationType } from 'nestjs-paginate';

@ApiTags('Admin - Reviews')
@ApiBearerAuth('access-token')
@UseGuards(AccessGuard, RoleGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.SUPER_ADMIN)
@Controller('admin/reviews')
export class ReviewAdminController {
    constructor(private readonly reviewService: ReviewService) { }

    @Get()
    @ApiPaginationQuery({
        paginationType: PaginationType.CURSOR,
        sortableColumns: ['id', 'rating', 'createdAt'],
        searchableColumns: ['comment', 'product.name'],
        filterableColumns: {
            productId: [FilterOperator.IN],
            userId: [FilterOperator.IN],
            isApproved: [FilterOperator.EQ],

        }
    })
    findAll(@Paginate() query: PaginateQuery) {
        return this.reviewService.findAllForAdmin(query);
    }

    @Patch(':id/status')
    updateStatus(@Param('id') id: number, @Body() dto: UpdateReviewStatusDto) {
        return this.reviewService.updateStatus(id, dto);
    }

    @Delete(':id')
    deleteReview(@Param('id') id: number) {
        return this.reviewService.removeByAdmin(id);
    }
}
