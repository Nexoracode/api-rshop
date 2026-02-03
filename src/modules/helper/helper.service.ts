import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HelperEntity } from './entities/helper.entity';
import { Repository } from 'typeorm';
import { CreateHelperDto } from './dto/create-helper.dto';
import { UpdateHelperDto } from './dto/update-helper.dto';
import { HelperMapper } from './mappers/helper.mapper';
import { FilterOperator, paginate, PaginateQuery } from 'nestjs-paginate';

@Injectable()
export class HelperService {
    constructor(
        @InjectRepository(HelperEntity)
        private readonly helperRepository: Repository<HelperEntity>
    ) { }

    async findOne(id: number) {
        const helper = await this.helperRepository.findOne({ where: { id }, relations: ['product'] });
        if (!helper) throw new NotFoundException('راهنمای سایز مورد نظر یافت نشد.');
        return HelperMapper.toResponse(helper);
    }

    async findAll(query: PaginateQuery) {
        const results = await paginate(query, this.helperRepository, {
            sortableColumns: ['id', 'title', 'description', 'image'],
            relations: ['product'],
            filterableColumns: {
                'product.id': [FilterOperator.EQ]
            },
            defaultSortBy: [['id', 'DESC']],
            searchableColumns: ['id', 'title'],
        });

        return {
            items: results.data.map((helper) => HelperMapper.toResponse(helper)),
            meta: results.meta,
            links: results.links,
        }
    }

    async addHelper(data: CreateHelperDto) {
        const helper = await this.helperRepository.create(data);
        const savedHelper = await this.helperRepository.save(helper);
        const result = await this.helperRepository.findOneBy({ id: savedHelper.id });
        if (!result) throw new NotFoundException('راهنما یافت نشد');
        return HelperMapper.toResponse(result);
    }

    async updateHelper(id: number, data: UpdateHelperDto) {
        const helper = await this.helperRepository.findOneBy({ id });
        if (!helper) throw new NotFoundException('راهنما یافت نشد');
        const updateHelper = this.helperRepository.merge(helper, data);
        await this.helperRepository.save(updateHelper);
        const result = await this.helperRepository.findOneBy({ id: updateHelper.id });
        if (!result) throw new NotFoundException('راهنما یافت نشد');
        return HelperMapper.toResponse(updateHelper);
    }

    async remove(id: number) {
        const helper = await this.helperRepository.findOne({ where: { id }, relations: ['product'] });
        if (!helper) throw new NotFoundException('راهنمای سایز مورد نظر یافت نشد.');
        if (helper.product !== null) {
            throw new BadRequestException('این راهنمای سایز امکان حذف ندارد.');
        }
        const removed = await this.helperRepository.remove(helper);
        return {
            message: 'حذف با موفقیت انجام شد.',
            data: HelperMapper.toResponse(removed),
        }

    }
}
