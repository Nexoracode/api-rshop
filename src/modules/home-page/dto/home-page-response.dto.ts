import { ApiProperty } from '@nestjs/swagger';

export class HeroSliderResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'تسبیح تایگر چشم بین' })
  title: string;

  @ApiProperty({ example: 'لورم صنعت چاپ و از طراحان گرافیک است' })
  description: string;

  @ApiProperty({ name: 'image_url', example: '/uploads/sliders/slider1.jpg' })
  imageUrl: string;

  @ApiProperty({ name: 'background_color', example: '#E8B4D9' })
  backgroundColor: string;

  @ApiProperty({ name: 'button_text', example: 'مشاهده محصول' })
  buttonText: string;

  @ApiProperty({ name: 'button_link', example: '/products/123' })
  buttonLink: string;
}

export class SideBannerResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'مصحف همراه (طلاکوب)' })
  title: string;

  @ApiProperty({ example: 'از ۵۴۹,۹۱ تا ۵۵۹ هزار تومان' })
  subtitle: string;

  @ApiProperty({ name: 'image_url', example: '/uploads/banners/banner1.jpg' })
  imageUrl: string;

  @ApiProperty({ example: '/category/quran' })
  link: string;

  @ApiProperty({ example: 'top_right' })
  position: string;

  @ApiProperty({ name: 'badge_text', example: '14%', nullable: true })
  badgeText: string;

  @ApiProperty({ name: 'badge_color', example: '#FF0000', nullable: true })
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

  @ApiProperty({ name: 'discount_price', example: 200000, nullable: true })
  discountPrice: number;

  @ApiProperty({ name: 'discount_perecntage', example: 20, nullable: true })
  discountPercentage: number;

  @ApiProperty({ example: 10 })
  stock: number;

  @ApiProperty({ name: 'is_avaliable', example: true })
  isAvailable: boolean;

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

  @ApiProperty({ name: 'section_type', example: 'special_products' })
  sectionType: string;

  @ApiProperty({ name: 'display_style', example: 'carousel' })
  displayStyle: string;

  @ApiProperty({ name: 'show_view_all_button', example: true })
  showViewAllButton: boolean;

  @ApiProperty({ name: 'view_All_link', example: '/products?featured=true' })
  viewAllLink: string;

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
