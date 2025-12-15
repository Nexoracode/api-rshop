# 🗂️ دریافت دسته‌بندی با تمام Parent ها

## ✅ چه چیزی اضافه شد:

### 1. **CategoryService** - دو متد جدید:

#### `findBySlugWithParents(slug: string)`
دریافت دسته‌بندی با slug به همراه تمام parent ها

#### `findByIdWithParents(id: number)`
دریافت دسته‌بندی با ID به همراه تمام parent ها

---

## 📊 ساختار خروجی:

```typescript
{
  // دسته‌بندی اصلی
  category: ICategoryResponse,
  
  // آرایه‌ای از تمام parent ها (از بالاترین root تا پایین‌ترین)
  parents: ICategoryResponse[],
  
  // Breadcrumb کامل (مسیر کامل از root تا category)
  breadcrumb: Array<{
    id: number;
    title: string;
    slug: string;
    level: number;
  }>
}
```

---

## 🎯 مثال استفاده:

### فرض کنید ساختار زیر رو داریم:

```
الکترونیک (level: 1, slug: electronics)
  └─ موبایل (level: 2, slug: mobile)
      └─ سامسونگ (level: 3, slug: samsung)
          └─ گلکسی (level: 4, slug: galaxy)
              └─ گلکسی S24 (level: 5, slug: galaxy-s24)
```

---

### درخواست 1: جستجو با slug

```http
GET /category/site/with-parents/slug/galaxy-s24
```

### پاسخ:

```json
{
  "category": {
    "id": 50,
    "title": "گلکسی S24",
    "slug": "galaxy-s24",
    "level": 5,
    "description": "محصولات گلکسی S24",
    "isActive": true,
    "displayOrder": 0,
    "children": [],
    "media": null,
    "parentId": 40
  },
  
  "parents": [
    {
      "id": 10,
      "title": "الکترونیک",
      "slug": "electronics",
      "level": 1,
      "parentId": null
    },
    {
      "id": 20,
      "title": "موبایل",
      "slug": "mobile",
      "level": 2,
      "parentId": 10
    },
    {
      "id": 30,
      "title": "سامسونگ",
      "slug": "samsung",
      "level": 3,
      "parentId": 20
    },
    {
      "id": 40,
      "title": "گلکسی",
      "slug": "galaxy",
      "level": 4,
      "parentId": 30
    }
  ],
  
  "breadcrumb": [
    {
      "id": 10,
      "title": "الکترونیک",
      "slug": "electronics",
      "level": 1
    },
    {
      "id": 20,
      "title": "موبایل",
      "slug": "mobile",
      "level": 2
    },
    {
      "id": 30,
      "title": "سامسونگ",
      "slug": "samsung",
      "level": 3
    },
    {
      "id": 40,
      "title": "گلکسی",
      "slug": "galaxy",
      "level": 4
    },
    {
      "id": 50,
      "title": "گلکسی S24",
      "slug": "galaxy-s24",
      "level": 5
    }
  ]
}
```

---

### درخواست 2: جستجو با ID

```http
GET /category/site/with-parents/id/50
```

**پاسخ همان بالاست** ✅

---

## 🎨 استفاده در Frontend:

### 1. نمایش Breadcrumb:

```jsx
// React/Next.js
function CategoryBreadcrumb({ breadcrumb }) {
  return (
    <nav className="flex items-center gap-2 text-sm">
      <a href="/">خانه</a>
      {breadcrumb.map((item, index) => (
        <React.Fragment key={item.id}>
          <span className="text-gray-400">/</span>
          {index === breadcrumb.length - 1 ? (
            <span className="font-semibold">{item.title}</span>
          ) : (
            <a href={`/category/${item.slug}`} className="text-blue-600 hover:underline">
              {item.title}
            </a>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

// استفاده:
<CategoryBreadcrumb breadcrumb={data.breadcrumb} />

// خروجی:
// خانه / الکترونیک / موبایل / سامسونگ / گلکسی / گلکسی S24
```

---

### 2. نمایش Parent Categories در Sidebar:

```jsx
function ParentCategories({ parents, current }) {
  return (
    <aside className="w-64 p-4 bg-gray-50 rounded">
      <h3 className="font-bold mb-4">دسته‌بندی‌های مرتبط</h3>
      <ul className="space-y-2">
        {parents.map((parent, index) => (
          <li key={parent.id} style={{ paddingRight: `${index * 16}px` }}>
            <a href={`/category/${parent.slug}`} className="text-gray-700 hover:text-blue-600">
              {parent.title}
            </a>
          </li>
        ))}
        <li style={{ paddingRight: `${parents.length * 16}px` }} className="font-semibold">
          {current.title}
        </li>
      </ul>
    </aside>
  );
}

// استفاده:
<ParentCategories parents={data.parents} current={data.category} />

// خروجی:
// الکترونیک
//   موبایل
//     سامسونگ
//       گلکسی
//         گلکسی S24 (bold)
```

---

### 3. نمایش Navigation Tree:

```jsx
function CategoryNavTree({ parents, current }) {
  return (
    <div className="border rounded p-4">
      <div className="text-xs text-gray-500 mb-2">شما اینجا هستید:</div>
      {parents.map((parent, index) => (
        <div key={parent.id} className="mb-1">
          <a 
            href={`/category/${parent.slug}`}
            className="text-sm text-blue-600 hover:underline"
            style={{ marginRight: `${index * 12}px` }}
          >
            ↳ {parent.title}
          </a>
        </div>
      ))}
      <div className="text-sm font-semibold" style={{ marginRight: `${parents.length * 12}px` }}>
        ↳ {current.title}
      </div>
    </div>
  );
}
```

---

## 🚀 Endpoints:

### 1. دریافت با Slug (Public):
```
GET /category/site/with-parents/slug/:slug
```

**مثال:**
```bash
curl http://localhost:3001/category/site/with-parents/slug/galaxy-s24
```

---

### 2. دریافت با ID (Public):
```
GET /category/site/with-parents/id/:id
```

**مثال:**
```bash
curl http://localhost:3001/category/site/with-parents/id/50
```

---

## 📝 نکات مهم:

1. **مرتب‌سازی Parent ها**: همیشه از root (level کم) به child (level زیاد) مرتب هستند
2. **Breadcrumb کامل**: شامل خود دسته هم هست (آخرین آیتم)
3. **Parents خالص**: فقط parent ها، بدون خود دسته
4. **استفاده از TreeRepository**: از قابلیت‌های TypeORM برای Tree استفاده می‌کنه
5. **Public Endpoint**: نیازی به احراز هویت نداره

---

## 🎯 موارد استفاده:

✅ **Breadcrumb Navigation**: مسیر کامل دسته‌بندی  
✅ **Sidebar Menu**: نمایش والدهای دسته  
✅ **SEO**: ساختار داده Schema.org Breadcrumb  
✅ **Filters**: فیلترهای دسته‌بندی سلسله‌مراتبی  
✅ **Analytics**: ردیابی عمق دسته‌بندی  

---

## ✅ مثال واقعی:

```bash
# تست با دسته موجود
GET /category/site/with-parents/slug/YOUR_CATEGORY_SLUG

# پاسخ:
{
  "category": { ... },
  "parents": [ ... ],
  "breadcrumb": [ ... ]
}
```

---

**آماده است! هر دسته‌بندی رو با تمام parent هاش میتونی دریافت کنی!** 🎉
