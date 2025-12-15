# 🗂️ دریافت دسته‌بندی با تمام Parent ها (بدون Children) - برای SEO

## ✅ خروجی تمیز فقط شامل Parent ها

### ساختار مثال:
```
الکترونیک (level 1)
  └─ موبایل (level 2)
      └─ سامسونگ (level 3)
          └─ گلکسی (level 4)
              └─ گلکسی S24 (level 5)  ← این رو جستجو میکنیم
```

---

## 📊 خروجی API:

### درخواست:
```http
GET /category/site/with-parents/slug/galaxy-s24
```

### پاسخ (بدون children):
```json
{
  "category": {
    "id": 50,
    "title": "گلکسی S24",
    "slug": "galaxy-s24",
    "description": "محصولات گلکسی S24 سری جدید",
    "level": 5,
    "isActive": true,
    "media": {
      "id": 100,
      "url": "https://example.com/galaxy-s24.jpg"
    }
  },
  
  "parents": [
    {
      "id": 10,
      "title": "الکترونیک",
      "slug": "electronics",
      "description": "محصولات الکترونیکی",
      "level": 1
    },
    {
      "id": 20,
      "title": "موبایل",
      "slug": "mobile",
      "description": "گوشی‌های موبایل",
      "level": 2
    },
    {
      "id": 30,
      "title": "سامسونگ",
      "slug": "samsung",
      "description": "محصولات برند سامسونگ",
      "level": 3
    },
    {
      "id": 40,
      "title": "گلکسی",
      "slug": "galaxy",
      "description": "سری گلکسی سامسونگ",
      "level": 4
    }
  ],
  
  "breadcrumb": [
    { "id": 10, "title": "الکترونیک", "slug": "electronics", "level": 1 },
    { "id": 20, "title": "موبایل", "slug": "mobile", "level": 2 },
    { "id": 30, "title": "سامسونگ", "slug": "samsung", "level": 3 },
    { "id": 40, "title": "گلکسی", "slug": "galaxy", "level": 4 },
    { "id": 50, "title": "گلکسی S24", "slug": "galaxy-s24", "level": 5 }
  ]
}
```

---

## 🎯 استفاده برای SEO:

### 1. Schema.org Breadcrumb:

```jsx
// React/Next.js - Generate Breadcrumb Schema
function generateBreadcrumbSchema(breadcrumb) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumb.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.title,
      "item": `https://yoursite.com/category/${item.slug}`
    }))
  };
}

// استفاده:
const schema = generateBreadcrumbSchema(data.breadcrumb);

// خروجی JSON-LD:
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "الکترونیک",
      "item": "https://yoursite.com/category/electronics"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "موبایل",
      "item": "https://yoursite.com/category/mobile"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "سامسونگ",
      "item": "https://yoursite.com/category/samsung"
    },
    {
      "@type": "ListItem",
      "position": 4,
      "name": "گلکسی",
      "item": "https://yoursite.com/category/galaxy"
    },
    {
      "@type": "ListItem",
      "position": 5,
      "name": "گلکسی S24",
      "item": "https://yoursite.com/category/galaxy-s24"
    }
  ]
}
</script>
```

---

### 2. Meta Tags برای SEO:

```jsx
// Next.js Metadata
export async function generateMetadata({ params }) {
  const data = await fetch(`/category/site/with-parents/slug/${params.slug}`).then(r => r.json());
  
  const breadcrumbPath = data.breadcrumb.map(b => b.title).join(' > ');
  
  return {
    title: `${data.category.title} | ${breadcrumbPath}`,
    description: data.category.description || `خرید محصولات ${data.category.title}`,
    openGraph: {
      title: data.category.title,
      description: data.category.description,
      type: 'website',
    },
  };
}

// خروجی HTML:
<title>گلکسی S24 | الکترونیک > موبایل > سامسونگ > گلکسی</title>
<meta name="description" content="خرید محصولات گلکسی S24" />
```

---

### 3. Canonical URL و Parent URLs:

```jsx
// Generate Canonical and Parent Links
function generateLinks(category, parents) {
  const canonical = `https://yoursite.com/category/${category.slug}`;
  
  const parentLinks = parents.map(p => ({
    rel: 'up',
    href: `https://yoursite.com/category/${p.slug}`,
    title: p.title
  }));
  
  return { canonical, parentLinks };
}

// خروجی HTML:
<link rel="canonical" href="https://yoursite.com/category/galaxy-s24" />
<link rel="up" href="https://yoursite.com/category/electronics" title="الکترونیک" />
<link rel="up" href="https://yoursite.com/category/mobile" title="موبایل" />
<link rel="up" href="https://yoursite.com/category/samsung" title="سامسونگ" />
<link rel="up" href="https://yoursite.com/category/galaxy" title="گلکسی" />
```

---

### 4. نمایش Breadcrumb در صفحه:

```jsx
// Simple Breadcrumb Component
function Breadcrumb({ breadcrumb }) {
  return (
    <nav aria-label="breadcrumb" className="text-sm mb-4">
      <ol className="flex items-center gap-2">
        <li>
          <a href="/" className="text-blue-600 hover:underline">خانه</a>
        </li>
        {breadcrumb.map((item, index) => (
          <li key={item.id} className="flex items-center gap-2">
            <span className="text-gray-400">/</span>
            {index === breadcrumb.length - 1 ? (
              <span className="text-gray-900 font-medium">{item.title}</span>
            ) : (
              <a 
                href={`/category/${item.slug}`}
                className="text-blue-600 hover:underline"
              >
                {item.title}
              </a>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// خروجی:
// خانه / الکترونیک / موبایل / سامسونگ / گلکسی / گلکسی S24
```

---

### 5. Parent Categories Navigation:

```jsx
// Parent Navigation
function ParentNavigation({ parents }) {
  return (
    <aside className="mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">دسته‌های مرتبط:</h3>
      <ul className="space-y-1">
        {parents.map(parent => (
          <li key={parent.id}>
            <a 
              href={`/category/${parent.slug}`}
              className="text-sm text-blue-600 hover:underline"
            >
              {parent.title}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}

// خروجی:
// دسته‌های مرتبط:
// - الکترونیک
// - موبایل
// - سامسونگ
// - گلکسی
```

---

## 🚀 Endpoints:

### با Slug (Public):
```
GET /category/site/with-parents/slug/:slug
```

### با ID (Public):
```
GET /category/site/with-parents/id/:id
```

---

## 📝 تفاوت با قبل:

### ❌ قبل (با children):
```json
{
  "category": {
    "id": 50,
    "children": [...]  // ❌ میومد
  }
}
```

### ✅ حالا (بدون children):
```json
{
  "category": {
    "id": 50,
    "title": "گلکسی S24",
    "slug": "galaxy-s24",
    "description": "...",
    "level": 5,
    "isActive": true,
    "media": { ... }
    // ✅ فقط اطلاعات خود دسته - بدون children
  },
  "parents": [...],  // ✅ فقط parent ها
  "breadcrumb": [...] // ✅ مسیر کامل
}
```

---

## ✅ مزایا برای SEO:

✅ **Breadcrumb Schema**: برای Google Rich Results  
✅ **Canonical URLs**: جلوگیری از محتوای تکراری  
✅ **Parent Links**: ساختار سلسله‌مراتبی واضح  
✅ **Meta Tags**: عنوان و توضیحات بهینه  
✅ **Clean URLs**: مسیر واضح دسته‌بندی  
✅ **خروجی سبک**: بدون children اضافی  

---

## 🧪 تست:

```bash
# تست با slug
curl http://localhost:3001/category/site/with-parents/slug/YOUR_SLUG

# پاسخ:
{
  "category": { "id": X, "title": "...", ... },  // بدون children
  "parents": [...],
  "breadcrumb": [...]
}
```

---

**آماده است! خروجی تمیز فقط با parent ها، بدون children!** 🎉
