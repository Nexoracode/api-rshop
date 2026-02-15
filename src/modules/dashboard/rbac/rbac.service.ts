import { Injectable } from '@nestjs/common';
import { Role } from 'src/common/enums/role.enum';
import {
  IPermission,
  IRbacResponse,
  ISidebarItem,
} from './rbac.interface';
import {
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  SIDEBAR_DEFINITION,
} from './rbac.config';

@Injectable()
export class RbacService {

  /**
   * دریافت کامل RBAC یک نقش:
   * - لیست دسترسی‌ها (permissions)
   * - sidebar فیلترشده بر اساس نقش
   */
  getRbacForRole(role: Role): IRbacResponse {
    return {
      role,
      roleLabel: ROLE_LABELS[role] ?? role,
      permissions: this.getPermissionsForRole(role),
      sidebar: this.getSidebarForRole(role),
    };
  }

  /**
   * فقط دسترسی‌های یک نقش (بدون sidebar)
   */
  getPermissionsForRole(role: Role): IPermission[] {
    const rolePerms = ROLE_PERMISSIONS[role] ?? {};
    return Object.entries(rolePerms).map(([resource, actions]) => ({
      resource: resource as IPermission['resource'],
      actions,
    }));
  }

  /**
   * فقط sidebar فیلترشده برای نقش
   */
  getSidebarForRole(role: Role): ISidebarItem[] {
    return SIDEBAR_DEFINITION
      .filter((item) => this.roleHasAccess(role, item.allowedRoles))
      .map((item) => ({
        ...item,
        children: item.children
          ?.filter((child) => this.roleHasAccess(role, child.allowedRoles))
          ?? undefined,
      }));
  }

  /**
   * چک می‌کند آیا نقش داده‌شده به یک resource دسترسی دارد
   */
  hasPermission(
    role: Role,
    resource: IPermission['resource'],
    action: IPermission['actions'][number],
  ): boolean {
    const perms = ROLE_PERMISSIONS[role] ?? {};
    return perms[resource]?.includes(action) ?? false;
  }

  /**
   * لیست همه نقش‌ها با برچسب فارسی و خلاصه دسترسی‌هایشان
   * (برای صفحه مدیریت ادمین‌ها)
   */
  getAllRolesSummary() {
    const adminRoles: Role[] = [
      Role.SUPER_ADMIN,
      Role.ADMIN,
      Role.MANAGER,
      Role.ACCOUNTANT,
      Role.WERHOUSE_MANAGER,
      Role.STAFF,
    ];

    return adminRoles.map((role) => ({
      role,
      label: ROLE_LABELS[role],
      permissionsCount: Object.keys(ROLE_PERMISSIONS[role] ?? {}).length,
      permissions: this.getPermissionsForRole(role),
      sidebarItemsCount: this.getSidebarForRole(role).length,
    }));
  }

  // ─── helper ─────────────────────────────────────────────────────────────────

  private roleHasAccess(role: Role, allowedRoles: Role[] | null): boolean {
    if (allowedRoles === null) return true;
    return allowedRoles.includes(role);
  }
}
