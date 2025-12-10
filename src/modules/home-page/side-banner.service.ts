import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SideBanner, BannerPosition } from './entities/side-banner.entity';
import { CreateSideBannerDto, UpdateSideBannerDto } from './dto/side-banner.dto';

@Injectable()
export class SideBannerService {
  constructor(
    @InjectRepository(SideBanner)
    private sideBannerRepository: Repository<SideBanner>,
  ) { }

  async create(createDto: CreateSideBannerDto): Promise<SideBanner> {
    const banner = this.sideBannerRepository.create(createDto);
    return await this.sideBannerRepository.save(banner);
  }

  async findAll(): Promise<SideBanner[]> {
    return await this.sideBannerRepository.find({
      order: { position: 'ASC', sortOrder: 'ASC' },
    });
  }

  async findAllActive(): Promise<SideBanner[]> {
    return await this.sideBannerRepository.find({
      where: { isActive: true },
      order: { position: 'ASC', sortOrder: 'ASC' },
    });
  }

  async findByPosition(position: BannerPosition): Promise<SideBanner[]> {
    return await this.sideBannerRepository.find({
      where: { position, isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async findOne(id: number): Promise<SideBanner> {
    const banner = await this.sideBannerRepository.findOne({ where: { id } });
    if (!banner) {
      throw new NotFoundException(`Side banner with ID ${id} not found`);
    }
    return banner;
  }

  async update(id: number, updateDto: UpdateSideBannerDto): Promise<SideBanner> {
    const banner = await this.findOne(id);
    Object.assign(banner, updateDto);
    return await this.sideBannerRepository.save(banner);
  }

  async remove(id: number): Promise<void> {
    const banner = await this.findOne(id);
    await this.sideBannerRepository.remove(banner);
  }
}
