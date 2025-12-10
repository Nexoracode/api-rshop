import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HeroSlider } from './entities/hero-slider.entity';
import { CreateHeroSliderDto, UpdateHeroSliderDto } from './dto/hero-slider.dto';

@Injectable()
export class HeroSliderService {
  constructor(
    @InjectRepository(HeroSlider)
    private heroSliderRepository: Repository<HeroSlider>,
  ) { }

  async create(createDto: CreateHeroSliderDto): Promise<HeroSlider> {
    const slider = this.heroSliderRepository.create(createDto);
    return await this.heroSliderRepository.save(slider);
  }

  async findAll(): Promise<HeroSlider[]> {
    return await this.heroSliderRepository.find({
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async findAllActive(): Promise<HeroSlider[]> {
    return await this.heroSliderRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<HeroSlider> {
    const slider = await this.heroSliderRepository.findOne({ where: { id } });
    if (!slider) {
      throw new NotFoundException(`Hero slider with ID ${id} not found`);
    }
    return slider;
  }

  async update(id: number, updateDto: UpdateHeroSliderDto): Promise<HeroSlider> {
    const slider = await this.findOne(id);
    Object.assign(slider, updateDto);
    return await this.heroSliderRepository.save(slider);
  }

  async remove(id: number): Promise<void> {
    const slider = await this.findOne(id);
    await this.heroSliderRepository.remove(slider);
  }

  async updateSortOrder(updates: { id: number; sort_order: number }[]): Promise<void> {
    for (const update of updates) {
      await this.heroSliderRepository.update(update.id, {
        sortOrder: update.sort_order,
      });
    }
  }
}
