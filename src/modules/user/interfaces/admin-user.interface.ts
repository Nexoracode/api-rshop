import { Role } from 'src/common/enums/role.enum';

/** اطلاعاتی که ادمین از خودش می‌بینه */
export interface IAdminSelfInfo {
  id: number;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  role: Role;
  isActive: boolean;
  avatarUrl: string | null;
  createdAt: string;
  /** لیست دسترسی‌های این نقش */
  permissions: string[];
}

/** اطلاعاتی که بعد از ساخت کاربر جدید برمی‌گردد */
export interface ICreatedUserResponse {
  id: number;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
}
