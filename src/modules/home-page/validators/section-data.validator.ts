import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { SectionType } from '../entities/home-section.entity';

@ValidatorConstraint({ name: 'SectionDataValidator', async: false })
@Injectable()
export class SectionDataValidator implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const object = args.object as any;
    const sectionType = object.section_type;

    // اگر نوع بخش special_products است، باید product_ids مشخص شده باشد
    if (sectionType === SectionType.SPECIAL_PRODUCTS) {
      if (!object.product_ids || !Array.isArray(object.product_ids) || object.product_ids.length === 0) {
        return false;
      }
    }

    // اگر نوع بخش category_based است، باید category_id مشخص شده باشد
    if (sectionType === SectionType.CATEGORY_BASED) {
      if (!object.category_id || typeof object.category_id !== 'number') {
        return false;
      }
    }

    // اگر نوع بخش promotion_based است، باید promotion_id مشخص شده باشد
    if (sectionType === SectionType.PROMOTION_BASED) {
      if (!object.promotion_id || typeof object.promotion_id !== 'number') {
        return false;
      }
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    const object = args.object as any;
    const sectionType = object.section_type;

    if (sectionType === SectionType.SPECIAL_PRODUCTS) {
      return 'برای بخش های دستی (special_products)، فیلد product_ids الزامی است و باید حداقل یک محصول انتخاب شده باشد';
    }

    if (sectionType === SectionType.CATEGORY_BASED) {
      return 'برای بخش های دسته‌بندی محور (category_based)، فیلد category_id الزامی است';
    }

    if (sectionType === SectionType.PROMOTION_BASED) {
      return 'برای بخش های پروموشن محور (promotion_based)، فیلد promotion_id الزامی است';
    }

    return 'اطلاعات بخش نامعتبر است';
  }
}
