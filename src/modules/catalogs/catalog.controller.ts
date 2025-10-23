import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { Paginate, PaginateQuery } from 'nestjs-paginate';
import { Public } from 'src/common/decorator/public.decorator';

@ApiTags('Catalog')
@Controller('catalog')
export class CatalogController {
    constructor(private readonly catalogService: CatalogService) { }

    /**
     * 🔍 سرچ عمومی
     * GET /catalog/search?q=keyword
     */
    // @Public()
    // @Get('search')
    // @ApiOperation({
    //     summary: 'جستجوی عمومی در محصولات، دسته‌بندی‌ها و برندها',
    //     description: 'این API در محصولات (حداکثر 10 عدد)، دسته‌بندی‌ها و برندها جستجو می‌کند'
    // })
    // @ApiQuery({
    //     name: 'q',
    //     required: true,
    //     description: 'کلمه کلیدی جستجو (حداقل 2 کاراکتر)',
    //     example: 'گوشی'
    // })
    // async globalSearch(@Query('q') searchTerm: string) {
    //     const results = await this.catalogService.globalSearch(searchTerm);

    //     return {
    //         success: true,
    //         data: {
    //             products: results.products.map(p => ({
    //                 id: p.id,
    //                 name: p.name,
    //                 price: p.price,
    //                 discountAmount: p.discountAmount,
    //                 finalPrice: p.price - (p.discountAmount || 0),
    //                 image: p.mediaPinned?.url || null,
    //                 brand: p.brand ? {
    //                     id: p.brand.id,
    //                     name: p.brand.name,
    //                     slug: p.brand.slug,
    //                 } : null,
    //                 category: p.category ? {
    //                     id: p.category.id,
    //                     title: p.category.title,
    //                     slug: p.category.slug,
    //                 } : null,
    //             })),
    //             categories: results.categories.map(c => ({
    //                 id: c.id,
    //                 title: c.title,
    //                 slug: c.slug,
    //             })),
    //             brands: results.brands.map(b => ({
    //                 id: b.id,
    //                 name: b.name,
    //                 slug: b.slug,
    //                 logo: b.logo,
    //             })),
    //         },
    //         meta: {
    //             totalProducts: results.products.length,
    //             totalCategories: results.categories.length,
    //             totalBrands: results.brands.length,
    //             searchTerm,
    //         }
    //     };
    // }


    @Public()
    @Get('smart-search')
    @ApiOperation({ summary: 'سرچ هوشمند با گروه‌بندی' })
    @ApiQuery({ name: 'q', required: true, description: 'کلمه جستجو' })
    @ApiQuery({ name: 'limit', required: false, description: 'تعداد نتایج (پیش‌فرض: 50)' })
    async smartSearch(
        @Query('q') searchTerm: string,
        @Query('limit') limit?: string,
    ) {
        try {
            // validation
            if (!searchTerm) {
                return {
                    success: false,
                    message: 'لطفاً کلمه جستجو را وارد کنید',
                    data: null,
                };
            }

            if (searchTerm.length < 2) {
                return {
                    success: false,
                    message: 'حداقل 2 کاراکتر وارد کنید',
                    data: null,
                };
            }

            // جستجو
            const result = await this.catalogService.smartSearch(
                searchTerm,
                limit ? parseInt(limit) : 50
            );

            // اگه نتیجه‌ای نبود
            if (result.totalCount === 0) {
                return {
                    success: true,
                    message: 'نتیجه‌ای یافت نشد',
                    data: {
                        products: [],
                        byCategory: [],
                        byBrand: [],
                    },
                    meta: {
                        totalProducts: 0,
                        totalCategories: 0,
                        totalBrands: 0,
                        searchTerm,
                    }
                };
            }

            // فرمت کردن response
            return {
                success: true,
                message: `${result.totalCount} محصول یافت شد`,
                data: {
                    products: result.products,

                    byCategory: result.groupedByCategory.map(group => ({
                        category: group.category,
                        count: group.count,
                        message: `${group.count} محصول در دسته "${group.category.title}"`,
                        products: group.products.slice(0, 5),
                        viewAllUrl: `/catalog/${group.category.slug}?search=${searchTerm}`,
                    })),

                    byBrand: result.groupedByBrand.map(group => ({
                        brand: group.brand,
                        count: group.count,
                        message: `${group.count} محصول از برند "${group.brand.name}"`,
                        products: group.products.slice(0, 5),
                        viewAllUrl: `/brand/${group.brand.slug}?search=${searchTerm}`,
                    })),
                },
                meta: {
                    totalProducts: result.totalCount,
                    totalCategories: result.groupedByCategory.length,
                    totalBrands: result.groupedByBrand.length,
                    searchTerm,
                }
            };

        } catch (error) {
            console.error('❌ Smart Search Error:', error);
            return {
                success: false,
                message: 'خطا در جستجو',
                error: error.message,
                data: null,
            };
        }
    }


    /**
     * 📊 دریافت فیلترهای قابل اعمال
     * GET /catalog/:categorySlug/filters
     */
    @Public()
    @Get(':categorySlug/filters')
    @ApiOperation({
        summary: 'دریافت فیلترهای قابل اعمال برای یک دسته‌بندی',
        description: 'این API تمام فیلترهای موجود (برندها، ویژگی‌ها، محدوده قیمت و ...) را برای یک دسته‌بندی برمی‌گرداند'
    })
    @ApiParam({
        name: 'categorySlug',
        description: 'اسلاگ دسته‌بندی',
        example: 'mobile-phones'
    })
    // async getAvailableFilters(@Param('categorySlug') categorySlug: string) {
    //     const filters = await this.catalogService.getAvailableFilters(categorySlug);

    //     return {
    //         success: true,
    //         data: filters,
    //     };
    // }

    /**
     * 📊 آمار سرچ
     * GET /catalog/search-stats?q=گوشی
     */
    @Public()
    @Get('search-stats')
    @ApiOperation({
        summary: 'آمار نتایج جستجو',
        description: 'نمایش تعداد محصولات در هر دسته‌بندی و برند'
    })
    @ApiQuery({ name: 'q', required: true })
    async getSearchStats(@Query('q') searchTerm: string) {
        const stats = await this.catalogService.getSearchStats(searchTerm);

        return {
            success: true,
            message: `${stats.totalProducts} محصول یافت شد`,
            data: {
                total: stats.totalProducts,

                // پیام‌های آماده برای نمایش
                messages: {
                    summary: `${stats.totalProducts} محصول یافت شد`,
                    categories: stats.categories.map(c =>
                        `${c.productCount} محصول در دسته "${c.title}"`
                    ),
                    brands: stats.brands.map(b =>
                        `${b.productCount} محصول از برند "${b.name}"`
                    ),
                },

                // داده‌های خام
                categories: stats.categories,
                brands: stats.brands,
            },
            meta: {
                searchTerm,
            }
        };
    }

    // /**
    //  * 📦 لیست محصولات با فیلتر
    //  * GET /catalog/:categorySlug
    //  */
    // @Public()
    @Get(':categorySlug')
    @ApiOperation({
        summary: 'دریافت لیست محصولات یک دسته‌بندی با امکان فیلتر',
    })
    @ApiParam({
        name: 'categorySlug',
        description: 'اسلاگ دسته‌بندی',
        example: 'mobile-phones'
    })
    // async listWithFilters(
    //     @Paginate() query: PaginateQuery,
    //     @Param('categorySlug') categorySlug: string,
    // ) {
    //     const result = await this.catalogService.listWithFilters(query, categorySlug);

    //     return {
    //         success: true,
    //         data: result.data,
    //         meta: result.meta,
    //         filters: result.filters,
    //     };
    // }


    /**
     * 🎯 سرچ در دسته‌بندی خاص
     * GET /catalog/category/mobile-phones/search?q=سامسونگ
     */
    @Public()
    @Get('category/:categorySlug/search')
    @ApiOperation({
        summary: 'جستجو در یک دسته‌بندی خاص',
        description: 'محصولات را فقط در یک دسته‌بندی و زیردسته‌هایش جستجو می‌کند'
    })
    @ApiParam({ name: 'categorySlug', description: 'اسلاگ دسته‌بندی' })
    @ApiQuery({ name: 'q', required: true })
    @ApiQuery({ name: 'limit', required: false })
    async searchInCategory(
        @Param('categorySlug') categorySlug: string,
        @Query('q') searchTerm: string,
        @Query('limit') limit?: string,
    ) {
        const result = await this.catalogService.searchInCategory(
            searchTerm,
            categorySlug,
            limit ? parseInt(limit) : 20
        );

        return {
            success: true,
            message: `${result.totalCount} محصول در دسته "${result.category.title}" یافت شد`,
            data: {
                category: result.category,
                products: result.products,
            },
            meta: {
                totalProducts: result.totalCount,
                searchTerm,
                categorySlug,
            }
        };
    }

    /**
     * 🎯 سرچ در برند خاص
     * GET /catalog/brand/samsung/search?q=گلکسی
     */
    @Public()
    @Get('brand/:brandSlug/search')
    @ApiOperation({
        summary: 'جستجو در یک برند خاص',
        description: 'محصولات را فقط در یک برند جستجو می‌کند'
    })
    @ApiParam({ name: 'brandSlug', description: 'اسلاگ برند' })
    @ApiQuery({ name: 'q', required: true })
    @ApiQuery({ name: 'limit', required: false })
    async searchInBrand(
        @Param('brandSlug') brandSlug: string,
        @Query('q') searchTerm: string,
        @Query('limit') limit?: string,
    ) {
        const result = await this.catalogService.searchInBrand(
            searchTerm,
            brandSlug,
            limit ? parseInt(limit) : 20
        );

        return {
            success: true,
            message: `${result.totalCount} محصول از برند "${result.brand.name}" یافت شد`,
            data: {
                brand: result.brand,
                products: result.products,
            },
            meta: {
                totalProducts: result.totalCount,
                searchTerm,
                brandSlug,
            }
        };
    }
}