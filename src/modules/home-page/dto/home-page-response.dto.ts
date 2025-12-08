import { ApiProperty } from '@nestjs/swagger';

export class HeroSliderResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'تسبیح تایگر چشم بین' })
  title: string;

  @ApiProperty({ example: 'لورم صنعت چاپ و از طراحان گرافیک است' })
  description: string;

  @ApiProperty({ example: '/uploads/sliders/slider1.jpg' })
  imageUrl: string;

  @ApiProperty({ example: '#E8B4D9' })
  backgroundColor: string;

  @ApiProperty({ example: 'مشاهده محصول' })
  buttonText: string;

  @ApiProperty({ example: '/products/123' })
  buttonLink: string;
}

export class SideBannerResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'مصحف همراه (طلاکوب)' })
  title: string;

  @ApiProperty({ example: 'از ۵۴۹,۹۱ تا ۵۵۹ هزار تومان' })
  subtitle: string;

  @ApiProperty({ example: '/uploads/banners/banner1.jpg' })
  imageUrl: string;

  @ApiProperty({ example: '/category/quran' })
  link: string;

  @ApiProperty({ example: 'top_right' })
  position: string;

  @ApiProperty({ example: '14%', nullable: true })
  badgeText: string;

  @ApiProperty({ example: '#FF0000', nullable: true })
  badgeColor: string;
}

export class CategoryResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'کتاب های مذهبی' })
  name: string;

  @ApiProperty({ example: 'religious-books' })
  slug: string;

  @ApiProperty({ example: '/uploads/categories/cat1.jpg', nullable: true })
  image: string;
}

export class ProductInSectionDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'تسبیح عقیق' })
  name: string;

  @ApiProperty({ example: 'tasbih-aqiq' })
  slug: string;

  @ApiProperty({ example: 250000 })
  price: number;

  @ApiProperty({ example: 200000, nullable: true })
  discount_price: number;

  @ApiProperty({ example: 20, nullable: true })
  discount_percentage: number;

  @ApiProperty({ example: 10 })
  stock: number;

  @ApiProperty({ example: true })
  is_available: boolean;

  @ApiProperty({ example: '/uploads/products/product1.jpg', nullable: true })
  image: string;

  @ApiProperty({ type: () => CategoryResponseDto, nullable: true })
  category: CategoryResponseDto;

  @ApiProperty({ nullable: true })
  brand: {
    id: number;
    name: string;
    slug: string;
  };
}

export class HomeSectionResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'محصولات ویژه' })
  title: string;

  @ApiProperty({ example: 'special-products' })
  slug: string;

  @ApiProperty({ example: 'جدیدترین بندها و رنگ‌ها', nullable: true })
  description: string;

  @ApiProperty({ example: 'special_products' })
  section_type: string;

  @ApiProperty({ example: 'carousel' })
  display_style: string;

  @ApiProperty({ example: true })
  show_view_all_button: boolean;

  @ApiProperty({ example: '/products?featured=true' })
  view_all_link: string;

  @ApiProperty({ type: [ProductInSectionDto] })
  products: ProductInSectionDto[];
}

export class HomePageDataResponseDto {
  @ApiProperty({ type: [HeroSliderResponseDto], description: 'لیست اسلایدرهای فعال' })
  heroSliders: HeroSliderResponseDto[];

  @ApiProperty({ type: [SideBannerResponseDto], description: 'لیست بنرهای کناری فعال' })
  sideBanners: SideBannerResponseDto[];

  @ApiProperty({ type: [CategoryResponseDto], description: 'دسته‌بندی‌های اصلی' })
  categories: CategoryResponseDto[];

  @ApiProperty({ type: [HomeSectionResponseDto], description: 'بخش‌های مختلف صفحه با محصولات' })
  sections: HomeSectionResponseDto[];
}
