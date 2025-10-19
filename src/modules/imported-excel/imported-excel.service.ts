import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ExcelRow } from './types/imported.type';
import { runInTransaction } from 'src/common/helpers/transaction.helper';
import { Category } from '../category/entities/category.entity';
import { Product } from '../product/entities/product.entity';
import { CategoryService } from '../category/category.service';
import { Attribute } from '../attributes/attribute/entities/attribute.entity';
import { AttributeValue } from '../attributes/attribute-value/entities/attribute-value.entity';
import { AttributeGroup } from '../attributes/attribute-group/entities/attribute-group.entity';
@Injectable()
export class ImportedExcelService {

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) { }

  importFromExcel(rows: ExcelRow[]) {
    return runInTransaction(this.dataSource, async (manager) => {
      const categoryRepo = manager.getRepository(Category);
      const productRepo = manager.getRepository(Product);
      const groupAttributeRepo = manager.getRepository(AttributeGroup);
      const attributeRepo = manager.getRepository(Attribute);
      const attributeValueRepo = manager.getRepository(AttributeValue);

      let existsProductList: string[] = [];

      const productMappedRows: any[] = [];
      const attributeMapperRows: any[] = [];
      // convert persion field to model
      for (const row of rows) {
        const mapped: ExcelRow = {
          name: row['نام محصول'],
          price: row['قیمت'],
          stock: row['موجودی'],
          isSameDayShipping: row['ارسال امروز'],
          requiresPreparation: row['نیاز به آماده سازی'],
          preparationDays: row['تعداد زمان آماده سازی'],
          isLimitedStock: row['محدودیت سفارش'],
          discountAmount: row['تخفیف ( مبلغ )'],
          discountPrecent: row['تخفیف ( درصد )'],
          isFeatured: row['افزودن به پیشنهاد ویژه'],
          weightUnit: row['نوع وزن'],
          description: row['توضیحات'],
          isVisible: row['وضعیت نمایش'],
          orderLimit: row['تعداد سفارش'],
          category: row['نام دسته'],
          categorySlug: row['نامک دسته'],
          categoryDiscount: row['تخفیف دسته'],
          mainCategory: row['دسته مادر'],
          attributes: [],
        }

        for (let i = 1; i <= 10; i++) {
          const groupNameAttr = row[`گروه ${i}`]
          const groupSlugAttr = row[`نامک گروه ${i}`]
          const attrName = row[`ویژگی ${i}`];
          const attrValue = row[`مقدار ویژگی ${i}`];
          const displayColor = row[`کد رنگ ویژگی ${i}`];

          if (!attrName || !attrValue) continue;

          const existsGroup = await groupAttributeRepo.findOne({ where: { name: groupNameAttr } });
          if (!existsGroup) {
            const newGroup = groupAttributeRepo.create({
              name: groupNameAttr,
              slug: groupSlugAttr,
            })
          }
        }

        let category = await categoryRepo.findOne({ where: { title: mapped.category } });

        const parentCategory = await categoryRepo.findOne({ where: { id: mapped.mainCategory } });

        if (!category) {
          category = await categoryRepo.save({
            title: mapped.category,
            slug: mapped.categorySlug,
            discount: mapped.categoryDiscount !== undefined && mapped.categoryDiscount !== null ? String(mapped.categoryDiscount) : undefined,
            parent: parentCategory ?? null
          });
        }

        const existsProduct = await productRepo.findOne({ where: { name: mapped.name } });
        if (existsProduct) {
          existsProductList.push(existsProduct.name);
        } else {
          productMappedRows.push({
            name: mapped.name,
            price: mapped.price,
            stock: mapped.stock,
            isSameDayShipping: mapped.isSameDayShipping,
            requiresPreparation: mapped.requiresPreparation,
            preparationDays: mapped.preparationDays,
            isLimitedStock: mapped.isLimitedStock,
            discountAmount: mapped.discountAmount,
            discountPrecent: mapped.discountPrecent,
            isFeatured: mapped.isFeatured,
            weightUnit: mapped.weightUnit,
            description: mapped.description,
            isVisible: mapped.isVisible,
            orderLimit: mapped.orderLimit,
            category: category,
          });
        }
      }

      const importProduct = productRepo.create(productMappedRows);
      await productRepo.save(importProduct);
      return {
        message: 'محصولات با موفقیت ایجاد شد',
        warning: `محصولات ( ${existsProductList.join(',')} ) از قبل وجود داشتن.`
      };
    })
  }
}
