import { Role } from 'src/common/enums/role.enum';

// ─── انواع دسترسی‌ها ─────────────────────────────────────────────────────────

export type PermissionAction = 'view' | 'create' | 'update' | 'delete' | 'export';

export type PermissionResource =
  | 'dashboard'
  | 'users'
  | 'products'
  | 'categories'
  | 'brands'
  | 'orders'
  | 'payments'
  | 'reviews'
  | 'promotions'
  | 'support'
  | 'inventory'
  | 'accounting'
  | 'reports'
  | 'settings'
  | 'home_page'
  | 'collections'
  | 'store_info'
  | 'admins';

export interface IPermission {
  resource: PermissionResource;
  actions: PermissionAction[];
}

// ─── آیتم sidebar ────────────────────────────────────────────────────────────

export interface ISidebarItem {
  key: string;
  label: string;
  icon: string;
  path: string;
  /** اگه null بود یعنی همه نقش‌های ادمینی دسترسی دارن */
  allowedRoles: Role[] | null;
  /** زیرمنوها */
  children?: ISidebarChild[];
  badge?: string;
}

export interface ISidebarChild {
  key: string;
  label: string;
  path: string;
  allowedRoles: Role[] | null;
}

// ─── خروجی نهایی API ─────────────────────────────────────────────────────────

export interface IRbacResponse {
  role: Role;
  roleLabel: string;
  permissions: IPermission[];
  sidebar: ISidebarItem[];
}
