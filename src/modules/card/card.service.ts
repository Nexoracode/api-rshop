import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Card, CardStatus } from './entities/card.entity';
import { Repository } from 'typeorm';
import { CardItem } from './entities/card-item.entity';
import { Product } from '../product/entities/product.entity';
import { VariantProduct } from '../variant-product/entities/variant-product.entity';
import { User } from '../user/entities/user.entity';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { RemoveItemDto } from './dto/remove-item.dto';

@Injectable()
export class CardService {
  constructor(
    @InjectRepository(Card) private readonly cardRepo: Repository<Card>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(CardItem) private readonly cardItemRepo: Repository<CardItem>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(VariantProduct) private readonly variantRepo: Repository<VariantProduct>,
  ) { }

  private async getUser(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('user-not-found');
    return user;
  }

  async getOrCreateUserCard(userId: User): Promise<Card> {
    let card = await this.cardRepo.findOne({ where: { user: { id: userId.id } }, relations: ['items'] });
    if (!card) {
      const user = await this.getUser(userId.id);
      card = this.cardRepo.create({ user, status: CardStatus.OPEN });
      await this.cardRepo.save(card);
      card.items = [];
    }
    return card;
  }

  clampPercent(p?: number | null): number {
    if (p == null || Number.isNaN(p)) return 0;
    return Math.min(100, Math.max(0, p));
  }

  toInt(n: number | string): number {
    const num = typeof n === 'string' ? Number(n) : n;
    return Math.round(num || 0);
  }

  resolveUnitDiscount(basePrice: number | string, discountAmount?: number | string | null, discountPercent?: number | null) {
    const price = this.toInt(basePrice);
    let perUnitDiscount = 0;


    const amt = discountAmount == null ? 0 : this.toInt(discountAmount as any);
    const pct = this.clampPercent(discountPercent ?? 0);


    if (amt > 0) perUnitDiscount = amt;
    else if (pct > 0) perUnitDiscount = Math.floor((price * pct) / 100);


    const finalUnit = Math.max(0, price - perUnitDiscount);
    return { unitPriceSnapshot: price, perUnitDiscount, finalUnit };
  }

  private compute(card: Card) {
    let itemsCount = 0;
    let totalQuantity = 0;
    let subtotal = 0;
    let discountTotal = 0;


    for (const item of card.items || []) {
      itemsCount += 1;
      totalQuantity += item.quantity;
      subtotal += item.unitPrice * item.quantity;
      discountTotal += item.discount * item.quantity;
    }

    card.itemsCount = itemsCount;
    card.totalQuantity = totalQuantity;
    card.subtotal = subtotal;
    card.discountTotal = discountTotal;
    card.total = subtotal - discountTotal;
    return card;
  }

  async addItem(user: User, dto: AddItemDto) {
    const card = await this.getOrCreateUserCard(user);
    if (card.status !== CardStatus.OPEN) throw new BadRequestException('cart-locked');

    const product = await this.productRepo.findOne({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('product-not-found');

    let variant: VariantProduct | null = null;
    if (dto.variantId) {
      variant = await this.variantRepo.findOne({ where: { id: dto.variantId } });
      if (!variant) throw new NotFoundException('variant-not-found');
    }
    const basePrice = (variant?.price ?? (product as any).price) as number | string;
    const dAmount = (variant?.discountAmount ?? (product as any).discountAmount) as number | string | null | undefined;
    const dPercent = (variant?.discountPercent ?? (product as any).discountPercent) as number | null | undefined;

    const { unitPriceSnapshot, perUnitDiscount, finalUnit } =
      this.resolveUnitDiscount(basePrice, dAmount ?? null, dPercent ?? null);

    let item = await this.cardItemRepo.findOne({
      where: {
        card: { id: card.id },
        product: { id: product.id },
        variant: variant ? ({ id: variant.id } as any) : (null as any),
      } as any,
    });


    if (item) {
      item.quantity += dto.quantity;
      item.unitPrice = unitPriceSnapshot;
      item.discount = perUnitDiscount;
      item.lineTotal = finalUnit * item.quantity;
      await this.cardItemRepo.save(item);
    } else {
      item = this.cardItemRepo.create({
        card,
        product,
        variant: variant || null,
        quantity: dto.quantity,
        unitPrice: unitPriceSnapshot, // قبل از تخفیف (snapshot)
        discount: perUnitDiscount, // تخفیف هر واحد
        lineTotal: finalUnit * dto.quantity,
      });
      await this.cardItemRepo.save(item);
    }


    card.items = await this.cardItemRepo.find({ where: { card: { id: card.id } } });
    await this.cardRepo.save(this.compute(card));
    return {
      message: 'محصول با موفقیت به سبد خرید اضافه شد',
      data: item,
    };
  }
  async updateItem(user: User, dto: UpdateItemDto) {
    const card = await this.getOrCreateUserCard(user);
    const item = await this.cardItemRepo.findOne({ where: { id: dto.itemId }, relations: ['card'] });
    if (!item || item.card.id !== card.id) throw new NotFoundException('item-not-found');


    if (dto.quantity === 0) {
      await this.cardItemRepo.remove(item);
    } else {
      item.quantity = dto.quantity;
      const finalUnit = Math.max(0, item.unitPrice - item.discount);
      item.lineTotal = finalUnit * item.quantity;
      await this.cardItemRepo.save(item);
    }


    card.items = await this.cardItemRepo.find({ where: { card: { id: card.id } } });
    await this.cardRepo.save(this.compute(card));
    return card;
  }


  async removeItem(user: User, dto: RemoveItemDto) {
    return this.updateItem(user, { itemId: dto.itemId, quantity: 0 });
  }


  async getMyCard(user: User) {
    const card = await this.getOrCreateUserCard(user);
    card.items = await this.cardItemRepo.find({ where: { card: { id: card.id } } });
    return {
      message: 'سبد خرید کاربر با موفقیت بازیابی شد',
      data: this.compute(card)
    };
  }


  async clear(user: User) {
    const card = await this.getOrCreateUserCard(user);
    await this.cardItemRepo.delete({ card: { id: card.id } as any });
    card.items = [];
    return this.compute(await this.cardRepo.save(card));
  }


  async lock(user: User) {
    const card = await this.getOrCreateUserCard(user);
    if (!card.items?.length) throw new BadRequestException('سبد خرید شما خالی می باشد.');
    card.status = CardStatus.LOCKED;
    return this.cardRepo.save(card);
  }
}
