import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Card, CardStatus } from './entities/card.entity';
import { DataSource, Repository, In } from 'typeorm';
import { CardItem } from './entities/card-item.entity';
import { Product } from '../product/entities/product.entity';
import { VariantProduct } from '../variant-product/entities/variant-product.entity';
import { User } from '../user/entities/user.entity';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { RemoveItemDto } from './dto/remove-item.dto';
import { runInTransaction } from 'src/common/helpers/transaction.helper';

const relations = ['items', 'items.product', 'items.product.mediaPinned', 'items.variant', 'items.variant.attributes', 'items.variant.attributes.attribute', 'items.variant.attributes.value'];

function clampPercent(p?: number | null): number {
  if (p == null || Number.isNaN(p)) return 0;
  return Math.min(100, Math.max(0, p));
}


function toInt(n: number | string): number {
  const num = typeof n === 'string' ? Number(n) : n;
  return Math.round(num || 0);
}


function resolveUnitDiscount(basePrice: number | string, discountAmount?: number | string | null, discountPercent?: number | null) {
  const price = toInt(basePrice);
  let perUnitDiscount = 0;
  const amt = discountAmount == null ? 0 : toInt(discountAmount as any);
  const pct = clampPercent(discountPercent ?? 0);
  if (amt > 0) perUnitDiscount = amt; else if (pct > 0) perUnitDiscount = Math.floor((price * pct) / 100);
  const finalUnit = Math.max(0, price - perUnitDiscount);
  return { unitPriceSnapshot: price, perUnitDiscount, finalUnit };
}

/**
 * تابع جدید برای محاسبه صحیح تخفیف بر اساس variant vs product
 * اگر variant داریم: فقط تخفیف variant اعمال می‌شه
 * اگر variant نداریم: تخفیف product اعمال می‌شه
 */
function resolveDiscountByVariant(
  product: Product,
  variant: VariantProduct | null
): { basePrice: number; dAmount: number | null; dPercent: number | null } {
  if (variant) {
    // اگر variant داریم، فقط از قیمت و تخفیف variant استفاده می‌کنیم
    return {
      basePrice: variant.price ?? product.price,
      dAmount: variant.discountAmount ?? null,
      dPercent: variant.discountPercent ?? null,
    };
  } else {
    // اگر variant نداریم، از قیمت و تخفیف product استفاده می‌کنیم
    return {
      basePrice: product.price,
      dAmount: product.discountAmount ?? null,
      dPercent: product.discountPercent ?? null,
    };
  }
}

@Injectable()
export class CardService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Card)
    private readonly cardRepo: Repository<Card>,
    @InjectRepository(CardItem)
    private readonly cardItemRepo: Repository<CardItem>
  ) { }

  private computeSnapshot(items: CardItem[], card: Card) {
    card.itemsCount = items.length;
    card.totalQuantity = items.reduce((s, it) => s + it.quantity, 0);
    card.subtotal = items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
    card.discountTotal = items.reduce((s, it) => s + it.discount * it.quantity, 0);
    card.total = card.subtotal - card.discountTotal;
    return card;
  }

  async getOrCreateUserCard(user: User) {
    // مرحله 1: فقط کارت رو بگیر
    let card = await this.cardRepo.findOne({
      where: {
        user: { id: user.id },
        status: CardStatus.OPEN
      },
      select: ['id', 'status', 'itemsCount', 'totalQuantity', 'subtotal', 'discountTotal', 'total']
    });

    // مرحله 2: اگه نداره، بساز
    if (!card) {
      card = this.cardRepo.create({ user, status: CardStatus.OPEN, items: [] });
      await this.cardRepo.save(card);
      return card;
    }

    // مرحله 3: اگه آیتم داره، جداگانه آیتم‌ها رو بگیر
    if (card.itemsCount > 0) {
      const items = await this.cardItemRepo.find({
        where: { cardId: card.id },
        relations: ['product', 'product.mediaPinned', 'variant', 'variant.attributes', 'variant.attributes.attribute', 'variant.attributes.value']
      });
      card.items = items;
    }

    return card;
  }

  async addItem(user: User, dto: AddItemDto) {
    return runInTransaction(this.dataSource, async (manager) => {
      const cardRepo = manager.getRepository(Card);
      const itemRepo = manager.getRepository(CardItem);
      const productRepo = manager.getRepository(Product);
      const variantRepo = manager.getRepository(VariantProduct);

      // 🧱 ۱. پیدا کردن سبد فعال کاربر
      let card = await cardRepo.findOne({
        where: { user: { id: user.id }, status: CardStatus.OPEN },
        relations: ["items"],
        lock: { mode: "pessimistic_write" },
      });

      // اگر هیچ سبد باز نداشت، یکی جدید بساز
      if (!card) {
        card = cardRepo.create({ user, status: CardStatus.OPEN });
        await cardRepo.save(card);
        card.items = [];
      }

      // 🚫 اگر سبد در حال پرداخت بود (LOCKED) اجازه افزودن نداره
      if (card.status === CardStatus.LOCKED) {
        throw new BadRequestException("شما 1 سفارش در انتظار پرداخت دارید.");
      }

      // ✅ فقط سبد باز قابل تغییر است
      if (card.status !== CardStatus.OPEN) {
        throw new BadRequestException("سبد خرید بسته شده است.");
      }

      // ۲️⃣ دریافت محصول و واریانت
      const product = await productRepo.findOne({ where: { id: dto.productId } });
      if (!product) throw new NotFoundException("محصول یافت نشد.");

      let variant: VariantProduct | null = null;
      if (dto.variantId) {
        variant = await variantRepo.findOne({ where: { id: dto.variantId } });
        if (!variant) throw new NotFoundException("تنوع محصول یافت نشد.");
      }

      // ۳️⃣ محاسبه قیمت و تخفیف (استفاده از تابع جدید)
      const { basePrice, dAmount, dPercent } = resolveDiscountByVariant(product, variant);
      const { unitPriceSnapshot, perUnitDiscount, finalUnit } = resolveUnitDiscount(
        basePrice,
        dAmount,
        dPercent
      );

      // ۴️⃣ بررسی وجود آیتم قبلی در سبد
      let item = await itemRepo.findOne({
        where: {
          card: { id: card.id },
          product: { id: product.id },
          variant: variant ? ({ id: variant.id } as any) : (null as any),
        } as any,
        lock: { mode: "pessimistic_write" },
      });

      // ۵️⃣ بروزرسانی یا ایجاد آیتم
      if (item) {
        item.quantity += dto.quantity;
        item.unitPrice = unitPriceSnapshot;
        item.discount = perUnitDiscount;
        item.lineTotal = finalUnit * item.quantity;
        await itemRepo.save(item);
      } else {
        item = itemRepo.create({
          card: { id: card.id } as any,
          product: { id: product.id } as any,
          variant: variant ? ({ id: variant.id } as any) : null,
          quantity: dto.quantity,
          unitPrice: unitPriceSnapshot,
          discount: perUnitDiscount,
          lineTotal: finalUnit * dto.quantity,
        });
        await itemRepo.save(item);
      }

      // ۶️⃣ به‌روزرسانی snapshot سبد
      const items = await itemRepo.find({ where: { card: { id: card.id } } });
      const snapshot = this.computeSnapshot(items, card);
      await cardRepo.update(card.id, {
        itemsCount: snapshot.itemsCount,
        totalQuantity: snapshot.totalQuantity,
        subtotal: snapshot.subtotal,
        discountTotal: snapshot.discountTotal,
        total: snapshot.total,
      });

      return {
        message: 'عملیات با موفقیت انجام شد',
        itemId: item.id,
        cardId: card.id,
      }
    });
  }


  async updateItem(user: User, dto: UpdateItemDto) {
    return runInTransaction(this.dataSource, async (m) => {
      const cardRepo = m.getRepository(Card);
      const itemRepo = m.getRepository(CardItem);

      const card = await cardRepo.findOne({
        where: { user: { id: user.id }, status: CardStatus.OPEN },
        lock: { mode: 'pessimistic_write' },
      });
      if (!card) throw new NotFoundException('سبد خرید یافت نشد.');


      const item = await itemRepo.findOne({
        where: { id: dto.itemId },
        // relations: ['card'],
        lock: { mode: 'pessimistic_write' }
      });
      if (!item || item.cardId !== card.id) throw new NotFoundException('موردی برای سبد خرید یافت نشد.');


      if (dto.quantity === 0) {
        await itemRepo.remove(item);
      } else {
        item.quantity = dto.quantity;
        const finalUnit = Math.max(0, item.unitPrice - item.discount);
        item.lineTotal = finalUnit * item.quantity;
        await itemRepo.save(item);
      }

      const items = await itemRepo.find({ where: { card: { id: card.id } } });
      await cardRepo.save(this.computeSnapshot(items, card));
      return {
        message: item.quantity === 0 ? 'سبدخرید شما خالی شد' : 'سبدخرید شما با موفقیت بروزشد',
        itemId: item.id,
        cardId: card.id,
      }
    });
  }

  async removeItem(user: User, dto: RemoveItemDto) {
    return await this.updateItem(user, { itemId: dto.itemId, quantity: 0 });
  }

  async getMyCard(user: User) {
    const card = await this.getOrCreateUserCard(user);
    const items = await this.cardItemRepo.find({
      where: { card: { id: card.id } },
      relations: [
        'variant.attributes']
    });
    return this.computeSnapshot(items, card);
  }

  async clear(user: User) {
    return runInTransaction(this.dataSource, async (m) => {
      const cardRepo = m.getRepository(Card);
      const itemRepo = m.getRepository(CardItem);

      const card = await cardRepo.findOne({ where: { user: { id: user.id } }, lock: { mode: 'pessimistic_write' } });
      if (!card) throw new NotFoundException('cart-not-found');
      await itemRepo.delete({ card: { id: card.id } as any });
      card.itemsCount = 0; card.totalQuantity = 0; card.subtotal = 0; card.discountTotal = 0; card.total = 0;
      await cardRepo.save(card);
      return card;
    });
  }

  async lock(user: User) {
    return runInTransaction(this.dataSource, async (m) => {
      const cardRepo = m.getRepository(Card);
      const card = await cardRepo.findOne({ where: { user: { id: user.id } }, relations: ['items'], lock: { mode: 'pessimistic_write' } });
      if (!card) throw new NotFoundException('سبد خرید یافت نشد.');
      if (!card.items?.length) throw new BadRequestException('سبد خرید خالی می باشد.');
      card.status = CardStatus.LOCKED;
      await cardRepo.save(card);
      return card;
    });
  }
}

