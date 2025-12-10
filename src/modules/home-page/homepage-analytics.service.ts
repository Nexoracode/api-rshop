import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HomePageClickAnalytics, ClickElementType } from './entities/homepage-click-analytics.entity';

export interface ClickStatsResult {
  element_type: string;
  element_id: number;
  total_clicks: number;
  unique_users: number;
  last_click: Date;
}

@Injectable()
export class HomePageAnalyticsService {
  constructor(
    @InjectRepository(HomePageClickAnalytics)
    private clickAnalyticsRepository: Repository<HomePageClickAnalytics>,
  ) { }

  /**
   * ثبت کلیک روی یک عنصر
   */
  async trackClick(
    elementType: ClickElementType,
    elementId: number,
    userIp: string,
    userAgent: string,
  ): Promise<void> {
    const click = this.clickAnalyticsRepository.create({
      elementType: elementType,
      elementId: elementId,
      userIp: userIp,
      userAgent: userAgent,
    });

    await this.clickAnalyticsRepository.save(click);
  }

  /**
   * دریافت آمار کلیک‌ها برای یک عنصر
   */
  async getElementStats(
    elementType: ClickElementType,
    elementId: number,
  ): Promise<ClickStatsResult> {
    const result = await this.clickAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.element_type', 'element_type')
      .addSelect('analytics.element_id', 'element_id')
      .addSelect('COUNT(*)', 'total_clicks')
      .addSelect('COUNT(DISTINCT analytics.user_ip)', 'unique_users')
      .addSelect('MAX(analytics.clicked_at)', 'last_click')
      .where('analytics.element_type = :type', { type: elementType })
      .andWhere('analytics.element_id = :id', { id: elementId })
      .groupBy('analytics.element_type')
      .addGroupBy('analytics.element_id')
      .getRawOne();

    return result || {
      element_type: elementType,
      element_id: elementId,
      total_clicks: 0,
      unique_users: 0,
      last_click: null,
    };
  }

  /**
   * دریافت آمار کلی تمام اسلایدرها
   */
  async getAllSlidersStats(): Promise<ClickStatsResult[]> {
    return await this.clickAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.element_type', 'element_type')
      .addSelect('analytics.element_id', 'element_id')
      .addSelect('COUNT(*)', 'total_clicks')
      .addSelect('COUNT(DISTINCT analytics.user_ip)', 'unique_users')
      .addSelect('MAX(analytics.clicked_at)', 'last_click')
      .where('analytics.element_type = :type', { type: ClickElementType.HERO_SLIDER })
      .groupBy('analytics.element_type')
      .addGroupBy('analytics.element_id')
      .orderBy('total_clicks', 'DESC')
      .getRawMany();
  }

  /**
   * دریافت آمار کلی تمام بنرها
   */
  async getAllBannersStats(): Promise<ClickStatsResult[]> {
    return await this.clickAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.element_type', 'element_type')
      .addSelect('analytics.element_id', 'element_id')
      .addSelect('COUNT(*)', 'total_clicks')
      .addSelect('COUNT(DISTINCT analytics.user_ip)', 'unique_users')
      .addSelect('MAX(analytics.clicked_at)', 'last_click')
      .where('analytics.element_type = :type', { type: ClickElementType.SIDE_BANNER })
      .groupBy('analytics.element_type')
      .addGroupBy('analytics.element_id')
      .orderBy('total_clicks', 'DESC')
      .getRawMany();
  }

  /**
   * دریافت آمار کلیک‌ها در بازه زمانی
   */
  async getStatsInDateRange(
    elementType: ClickElementType,
    elementId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<any[]> {
    return await this.clickAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('DATE(analytics.clicked_at)', 'date')
      .addSelect('COUNT(*)', 'clicks')
      .addSelect('COUNT(DISTINCT analytics.user_ip)', 'unique_users')
      .where('analytics.element_type = :type', { type: elementType })
      .andWhere('analytics.element_id = :id', { id: elementId })
      .andWhere('analytics.clicked_at BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .groupBy('DATE(analytics.clicked_at)')
      .orderBy('date', 'ASC')
      .getRawMany();
  }
}
