import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecentView } from './entities/recent-view.entity';
import { CreateRecentViewDto } from './dto/create-recent-view.dto';
import { RequestUser } from 'src/common/interfaces/request-user.interface';
import { RecentViewMapper } from './mappers/recent-view.mapper';

@Injectable()
export class RecentViewService {
  private MAX_VIEWS = 20; // حداکثر تعداد آیتم ذخیره‌شده برای هر کاربر

  constructor(
    @InjectRepository(RecentView)
    private readonly repo: Repository<RecentView>,
  ) { }

  async add(user: RequestUser, dto: CreateRecentViewDto) {
    const exist = await this.repo.findOne({
      where: { userId: user.id, productId: dto.productId },
    });

    if (exist) {
      exist.updatedAt = new Date();
      return await this.repo.save(exist);
    }

    const recent = this.repo.create({
      userId: user.id,
      productId: dto.productId,
    });
    await this.repo.save(recent);

    // حذف آیتم‌های قدیمی اگر بیشتر از حد مجاز باشند
    const all = await this.repo.find({
      where: { userId: user.id },
      order: { updatedAt: 'DESC' },
    });

    if (all.length > this.MAX_VIEWS) {
      const toDelete = all.slice(this.MAX_VIEWS);
      await this.repo.remove(toDelete);
    }

    return recent;
  }

  async getAll(user: RequestUser) {
    const list = await this.repo.find({
      where: { userId: user.id },
      relations: ['product'],
      order: { updatedAt: 'DESC' },
    });
    return RecentViewMapper.toList(list);
  }
}
