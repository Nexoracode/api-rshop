import { Role } from 'src/common/enums/role.enum';
import { IPermission, ISidebarItem, PermissionAction, PermissionResource } from './rbac.interface';

// ─── برچسب فارسی نقش‌ها ──────────────────────────────────────────────────────

export const ROLE_LABELS: Record<Role, string> = {
  [Role.SUPER_ADMIN]:      'سوپر ادمین',
  [Role.ADMIN]:            'ادمین',
  [Role.MANAGER]:          'مدیر',
  [Role.ACCOUNTANT]:       'حسابدار',
  [Role.WERHOUSE_MANAGER]: 'مدیر انبار',
  [Role.STAFF]:            'کارمند',
  [Role.USER]:             'کاربر عادی',
};

// ─── دسترسی‌های هر نقش ───────────────────────────────────────────────────────

type RolePermissionMap = Record<PermissionResource, PermissionAction[]>;

const ALL_ACTIONS: PermissionAction[] = ['view', 'create', 'update', 'delete', 'export'];
const READ_ONLY:   PermissionAction[] = ['view'];
const READ_EXPORT: PermissionAction[] = ['view', 'export'];
const CRUD:        PermissionAction[] = ['view', 'create', 'update', 'delete'];
const CRUD_EXPORT: PermissionAction[] = ['view', 'create', 'update', 'delete', 'export'];

export const ROLE_PERMISSIONS: Record<Role, Partial<RolePermissionMap>> = {

  // ─── سوپر ادمین — دسترسی کامل ─────────────────────────────────────────────
  [Role.SUPER_ADMIN]: {
    dashboard:  ALL_ACTIONS,
    users:      ALL_ACTIONS,
    admins:     ALL_ACTIONS,
    products:   ALL_ACTIONS,
    categories: ALL_ACTIONS,
    brands:     ALL_ACTIONS,
    orders:     ALL_ACTIONS,
    payments:   ALL_ACTIONS,
    reviews:    ALL_ACTIONS,
    promotions: ALL_ACTIONS,
    support:    ALL_ACTIONS,
    inventory:  ALL_ACTIONS,
    accounting: ALL_ACTIONS,
    reports:    ALL_ACTIONS,
    settings:   ALL_ACTIONS,
    home_page:  ALL_ACTIONS,
    collections:ALL_ACTIONS,
    store_info: ALL_ACTIONS,
  },

  // ─── ادمین — تقریباً کامل، بدون تنظیمات حساس ──────────────────────────────
  [Role.ADMIN]: {
    dashboard:  READ_EXPORT,
    users:      CRUD_EXPORT,
    admins:     ['view', 'create'],
    products:   CRUD_EXPORT,
    categories: CRUD,
    brands:     CRUD,
    orders:     CRUD_EXPORT,
    payments:   ['view', 'update', 'export'],
    reviews:    CRUD,
    promotions: CRUD,
    support:    CRUD,
    inventory:  ['view', 'update'],
    accounting: ['view', 'export'],
    reports:    READ_EXPORT,
    settings:   ['view', 'update'],
    home_page:  CRUD,
    collections:CRUD,
    store_info: CRUD,
  },

  // ─── مدیر — مدیریت فروش و محصول ───────────────────────────────────────────
  [Role.MANAGER]: {
    dashboard:  READ_ONLY,
    products:   CRUD_EXPORT,
    categories: CRUD,
    brands:     CRUD,
    orders:     ['view', 'update', 'export'],
    payments:   READ_EXPORT,
    reviews:    ['view', 'update', 'delete'],
    promotions: CRUD,
    support:    ['view', 'update'],
    inventory:  READ_ONLY,
    reports:    READ_EXPORT,
    home_page:  CRUD,
    collections:CRUD,
    store_info: ['view', 'update'],
  },

  // ─── حسابدار — فقط مالی و گزارش ────────────────────────────────────────────
  [Role.ACCOUNTANT]: {
    dashboard:  READ_ONLY,
    orders:     READ_EXPORT,
    payments:   READ_EXPORT,
    accounting: READ_EXPORT,
    reports:    READ_EXPORT,
    inventory:  READ_ONLY,
  },

  // ─── مدیر انبار — انبار و محصول ────────────────────────────────────────────
  [Role.WERHOUSE_MANAGER]: {
    dashboard:  READ_ONLY,
    products:   ['view', 'update'],
    inventory:  CRUD,
    orders:     READ_ONLY,
    reports:    ['view'],
  },

  // ─── کارمند — پشتیبانی و سفارش ─────────────────────────────────────────────
  [Role.STAFF]: {
    dashboard:  READ_ONLY,
    orders:     ['view', 'update'],
    support:    CRUD,
    users:      READ_ONLY,
  },

  // ─── کاربر عادی — بدون دسترسی CMS ──────────────────────────────────────────
  [Role.USER]: {},
};

// ─── تعریف sidebar کامل ──────────────────────────────────────────────────────

/** همه نقش‌های ادمینی */
const ADMIN_ROLES: Role[] = [
  Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER,
  Role.ACCOUNTANT, Role.WERHOUSE_MANAGER, Role.STAFF,
];

export const SIDEBAR_DEFINITION: ISidebarItem[] = [
  {
    key: 'dashboard',
    label: 'داشبورد',
    icon: 'LayoutDashboard',
    path: '/admin',
    allowedRoles: ADMIN_ROLES,
  },

  // ─── محصولات ───────────────────────────────────────────────────────────────
  {
    key: 'products',
    label: 'محصولات',
    icon: 'Package',
    path: '/admin/products',
    allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.WERHOUSE_MANAGER],
    children: [
      {
        key: 'products_list',
        label: 'لیست محصولات',
        path: '/admin/products',
        allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.WERHOUSE_MANAGER],
      },
      {
        key: 'products_create',
        label: 'افزودن محصول',
        path: '/admin/products/create',
        allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER],
      },
      {
        key: 'categories',
        label: 'دسته‌بندی‌ها',
        path: '/admin/categories',
        allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER],
      },
      {
        key: 'brands',
        label: 'برندها',
        path: '/admin/brands',
        allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER],
      },
      {
        key: 'collections',
        label: 'کالکشن‌ها',
        path: '/admin/collections',
        allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER],
      },
    ],
  },

  // ─── سفارشات ───────────────────────────────────────────────────────────────
  {
    key: 'orders',
    label: 'سفارشات',
    icon: 'ShoppingCart',
    path: '/admin/orders',
    allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT, Role.STAFF],
    children: [
      {
        key: 'orders_all',
        label: 'همه سفارشات',
        path: '/admin/orders',
        allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT, Role.STAFF],
      },
      {
        key: 'payments',
        label: 'پرداخت‌ها',
        path: '/admin/payments',
        allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT],
      },
    ],
  },

  // ─── کاربران ───────────────────────────────────────────────────────────────
  {
    key: 'users',
    label: 'کاربران',
    icon: 'Users',
    path: '/admin/users',
    allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.STAFF],
    children: [
      {
        key: 'users_list',
        label: 'لیست کاربران',
        path: '/admin/users',
        allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.STAFF],
      },
      {
        key: 'admins',
        label: 'مدیریت ادمین‌ها',
        path: '/admin/users/admins',
        allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN],
      },
    ],
  },

  // ─── بازاریابی ─────────────────────────────────────────────────────────────
  {
    key: 'marketing',
    label: 'بازاریابی',
    icon: 'Megaphone',
    path: '/admin/marketing',
    allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER],
    children: [
      {
        key: 'promotions',
        label: 'تخفیف‌ها و کوپن',
        path: '/admin/promotions',
        allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER],
      },
      {
        key: 'reviews',
        label: 'نظرات کاربران',
        path: '/admin/reviews',
        allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER],
      },
    ],
  },

  // ─── انبارداری ─────────────────────────────────────────────────────────────
  {
    key: 'inventory',
    label: 'انبارداری',
    icon: 'Warehouse',
    path: '/admin/inventory',
    allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.WERHOUSE_MANAGER],
    children: [
      {
        key: 'inventory_list',
        label: 'موجودی انبار',
        path: '/admin/inventory',
        allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.WERHOUSE_MANAGER],
      },
      {
        key: 'stock_movements',
        label: 'حرکت کالا',
        path: '/admin/inventory/movements',
        allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.WERHOUSE_MANAGER],
      },
    ],
  },

  // ─── مالی و حسابداری ───────────────────────────────────────────────────────
  {
    key: 'accounting',
    label: 'مالی و حسابداری',
    icon: 'Landmark',
    path: '/admin/accounting',
    allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT, Role.MANAGER],
    children: [
      {
        key: 'accounting_transactions',
        label: 'تراکنش‌ها',
        path: '/admin/accounting/transactions',
        allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT, Role.MANAGER],
      },
      {
        key: 'reports',
        label: 'گزارشات',
        path: '/admin/reports',
        allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT, Role.MANAGER],
      },
    ],
  },

  // ─── پشتیبانی ──────────────────────────────────────────────────────────────
  {
    key: 'support',
    label: 'پشتیبانی',
    icon: 'HeadphonesIcon',
    path: '/admin/support',
    allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF],
  },

  // ─── محتوا و صفحه‌سازی ────────────────────────────────────────────────────
  {
    key: 'content',
    label: 'محتوا و CMS',
    icon: 'FileText',
    path: '/admin/content',
    allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER],
    children: [
      {
        key: 'home_page',
        label: 'صفحه اصلی',
        path: '/admin/home-page',
        allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER],
      },
      {
        key: 'store_info',
        label: 'صفحات فروشگاه',
        path: '/admin/store-info',
        allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER],
      },
    ],
  },

  // ─── تنظیمات ───────────────────────────────────────────────────────────────
  {
    key: 'settings',
    label: 'تنظیمات',
    icon: 'Settings',
    path: '/admin/settings',
    allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN],
  },
];
