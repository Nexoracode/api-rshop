# 🔗 TypeORM Relations - Complete Reference

## مشکل
```
TypeORMError: Relation with property path media in entity was not found.
```

## علت
نام relation اشتباه بود: `product.media` → باید `product.medias` باشه

## Product Entity Relations

### در Product Entity:

```typescript
@Entity('products')
export class Product {
  // ✅ Correct - جمع
  @OneToMany(() => Media, media => media.product, { cascade: true, eager: true })
  medias: Media[];

  // ✅ Correct - تصویر اصلی/انتخاب شده
  @ManyToOne(() => Media, media => media.product, { eager: true })
  @JoinColumn({ name: 'media_pinned_id' })
  mediaPinned: Media;

  @Column({ name: 'media_pinned_id', nullable: true })
  mediaPinnedId?: number | null;
}
```

### استفاده صحیح در Query Builder:

```typescript
// ✅ CORRECT
.leftJoinAndSelect('product.medias', 'productMedias')       // همه تصاویر
.leftJoinAndSelect('product.mediaPinned', 'productMediaPinned') // تصویر اصلی

// ❌ WRONG
.leftJoinAndSelect('product.media', 'productMedia')  // این relation وجود ندارد!
```

## تمام Relations موجود در Product

```typescript
// Category
.leftJoinAndSelect('product.category', 'category')

// Brand
.leftJoinAndSelect('product.brand', 'brand')

// Variants
.leftJoinAndSelect('product.variants', 'variants')

// Attribute Values
.leftJoinAndSelect('product.attributeValues', 'attributeValues')

// Helper
.leftJoinAndSelect('product.helper', 'helper')

// Reviews
.leftJoinAndSelect('product.reviews', 'reviews')

// Wishlists
.leftJoinAndSelect('product.wishlists', 'wishlists')

// Recent Views
.leftJoinAndSelect('product.recentViews', 'recentViews')

// Supports
.leftJoinAndSelect('product.supports', 'supports')

// Collections
.leftJoinAndSelect('product.collections', 'collections')

// ⭐ Media (مهم!)
.leftJoinAndSelect('product.medias', 'productMedias')           // همه تصاویر
.leftJoinAndSelect('product.mediaPinned', 'productMediaPinned') // تصویر اصلی
```

## VariantProduct Entity Relations

```typescript
@Entity('variants_product')
export class VariantProduct {
  @ManyToOne(() => Product, product => product.variants)
  product: Product

  @OneToMany(() => VariantAttributeValue, value => value.variant, { cascade: true, eager: true })
  attributes: VariantAttributeValue[]
}
```

### استفاده در Query Builder:

```typescript
// ✅ CORRECT
.leftJoinAndSelect('variant.product', 'variantProduct')
.leftJoinAndSelect('variant.attributes', 'variantAttributes')

// ❌ WRONG
.leftJoinAndSelect('variant.media', 'variantMedia')  // Variant اصلاً media ندارد!
.leftJoinAndSelect('variant.medias', 'variantMedias') // این هم نداره!
```

## Order Entity Relations

```typescript
@Entity('orders')
export class Order {
  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Address, { eager: true })
  address: Address;

  @OneToMany(() => Invoice, invoice => invoice.order)
  invoices: Invoice[];

  @OneToMany(() => OrderItem, item => item.order, { cascade: true })
  items: OrderItem[];

  @ManyToOne(() => GiftWrapping, { eager: true, nullable: true })
  giftWrapping?: GiftWrapping | null;
}
```

### استفاده در Query Builder:

```typescript
.leftJoinAndSelect('order.user', 'user')
.leftJoinAndSelect('order.address', 'address')
.leftJoinAndSelect('order.items', 'items')
.leftJoinAndSelect('order.invoices', 'invoices')
.leftJoinAndSelect('order.giftWrapping', 'giftWrapping')
```

## OrderItem Entity Relations

```typescript
@Entity('order_items')
export class OrderItem {
  @ManyToOne(() => Order, order => order.items)
  order: Order;

  @ManyToOne(() => Product, { eager: true })
  product: Product;

  @ManyToOne(() => VariantProduct, { eager: true, nullable: true })
  variant?: VariantProduct;
}
```

### استفاده در Query Builder:

```typescript
.leftJoinAndSelect('item.order', 'order')
.leftJoinAndSelect('item.product', 'product')
.leftJoinAndSelect('item.variant', 'variant')
```

## نکات مهم

### 1️⃣ نام Relation دقیقاً باید مطابق Entity باشه

```typescript
// در Entity اگر این باشه:
medias: Media[];

// در Query باید این باشه:
.leftJoinAndSelect('product.medias', 'alias')

// نه این:
.leftJoinAndSelect('product.media', 'alias')  // ❌
```

### 2️⃣ Alias می‌تونه هر چیزی باشه

```typescript
// همه اینا صحیحه:
.leftJoinAndSelect('product.medias', 'productMedias')
.leftJoinAndSelect('product.medias', 'images')
.leftJoinAndSelect('product.medias', 'pics')
.leftJoinAndSelect('product.medias', 'm')
```

### 3️⃣ OneToMany معمولاً جمع (plural) هست

```typescript
// ✅ جمع - OneToMany
medias: Media[];
variants: VariantProduct[];
reviews: Review[];

// ✅ مفرد - ManyToOne
product: Product;
category: Category;
brand: Brand;
```

### 4️⃣ Eager Loading vs Query Builder

```typescript
// اگر eager: true باشه، خودکار load می‌شه
@OneToMany(() => Media, media => media.product, { eager: true })
medias: Media[];

// ولی در QueryBuilder باید دستی join کنی:
.leftJoinAndSelect('product.medias', 'medias')
```

## مثال کامل - getOrdersByStatus

```typescript
async getOrdersByStatus(userId: number, status: OrderStatus[]) {
  return this.orderRepo
    .createQueryBuilder('order')
    
    // Order relations
    .leftJoinAndSelect('order.items', 'items')
    .leftJoinAndSelect('order.address', 'address')
    
    // OrderItem -> Product relations
    .leftJoinAndSelect('items.product', 'product')
    .leftJoinAndSelect('product.medias', 'productMedias')           // ✅ جمع
    .leftJoinAndSelect('product.mediaPinned', 'productMediaPinned') // ✅ مفرد
    .leftJoinAndSelect('product.brand', 'brand')
    
    // OrderItem -> Variant relations
    .leftJoinAndSelect('items.variant', 'variant')
    .leftJoinAndSelect('variant.attributes', 'variantAttributes')
    .leftJoinAndSelect('variantAttributes.attributeValue', 'attributeValue')
    .leftJoinAndSelect('attributeValue.attribute', 'attribute')
    
    // Filters
    .where('order.user_id = :userId', { userId })
    .andWhere('order.status IN (:...statuses)', { statuses })
    .orderBy('order.created_at', 'DESC')
    .getMany();
}
```

## چک لیست برای Debugging

وقتی error "Relation not found" گرفتی:

1. ✅ Entity رو باز کن و نام relation رو چک کن
2. ✅ جمع یا مفرد بودن رو چک کن (medias vs media)
3. ✅ ببین relation اصلاً تعریف شده یا نه
4. ✅ از eager loading استفاده نکن در QueryBuilder
5. ✅ alias می‌تونه هر چیزی باشه، مهم نیست

## Files Changed
- `src/modules/profile/profile.service.ts` ✅ Fixed: `product.media` → `product.medias`
