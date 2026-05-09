/**
 * Interface های HomePage
 */

import { Category } from "src/modules/category/entities/category.entity";

/**
 * انواع چیدمان صفحه اصلی
 */
export enum HomePageLayoutType {
  SIDE_BY_SIDE = 'side_by_side',  // کنار هم
  STACKED = 'stacked',              // زیر هم
}

export interface HeroSliderData {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  backgroundColor: string;
  isDark: boolean;
  isActive: boolean;
  buttonText: string;
  displayOrder: number;
  buttonLink: string;
}

export interface SideBannerData {
  id: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  backgroundColor: string;
  link: string;
  isActive: boolean;
  position: string;
  displayOrder: number;
  badgeText: string | null;
  badgeColor: string | null;
}

export interface PromoBannerData {
  id: number;
  title: string;
  backgroundColor: string;
  textColor: string;
  link: string;
  linkText: string;
  imageUrl: string;
  isActive: boolean;
  isClosable: boolean;
  displayOrder: number;
  startDate: Date | null;
  endDate: Date | null;
  displayDuration: number;
  description: string;
}

export interface CategoryData {
  id: number;
  name: string;
  slug: string;
  image: string | null;
}

export interface BrandData {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
}

export interface ProductData {
  id: number;
  name: string;
  price: number;
  // category: Category | null;
  stock: number;
  discountAmount?: number | null;
  discountPercent?: number | null;
  image: string | null;
  isActive: boolean;
}

export interface HomeSectionData {
  id: number;
  title: string;
  image: string | null;
  slug: string;
  description: string | null;
  sectionType: string;
  displayStyle: string;
  showViewAllButton: boolean;
  displayOrder: number;
  startDate: Date | null;
  endDate: Date | null;
  isActive: boolean;
  productsLimit: number;
  viewAllLink: string | null;
  category: CategoryData | null;
  products: ProductData[];
}

export interface HomePageData {
  layoutType?: HomePageLayoutType;  // ✅ optional کردیم
  heroSliders: HeroSliderData[];
  sideBanners: SideBannerData[];
  categories: CategoryData[];
  brands: BrandData[];
  sections: HomeSectionData[];
}
