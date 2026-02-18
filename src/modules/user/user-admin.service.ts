import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from 'src/common/enums/role.enum';
import { RequestUser } from 'src/common/interfaces/request-user.interface';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import {
  IAdminSelfInfo,
  ICreatedUserResponse,
} from './interfaces/admin-user.interface';

/** نقش‌هایی که فقط SUPER_ADMIN می‌تواند بسازد */
const SUPER_ADMIN_ONLY_ROLES: Role[] = [Role.SUPER_ADMIN, Role.ADMIN];

/** نقش‌هایی که ADMIN می‌تواند بسازد */
const ADMIN_ALLOWED_ROLES: Role[] = [
  Role.MANAGER,
  Role.ACCOUNTANT,
  Role.WERHOUSE_MANAGER,
  Role.STAFF,
];

/** دسترسی‌های هر نقش برای نمایش به کاربر */
const ROLE_PERMISSIONS: Record<Role, string[]> = {
  [Role.SUPER_ADMIN]: [
    'مدیریت کامل سیستم',
    'ایجاد و حذف ادمین',
    'ایجاد و حذف هر نقشی',
    'مشاهده گزارشات مالی',
    'مدیریت تنظیمات سایت',
    'مدیریت محصولات',
    'مدیریت سفارشات',
    'مدیریت کاربران',
    'مشاهده لاگ‌ها',
  ],
  [Role.ADMIN]: [
    'ایجاد کاربران با نقش‌های پایین‌تر',
    'مدیریت محصولات',
    'مدیریت سفارشات',
    'مدیریت کاربران عادی',
    'مشاهده گزارشات',
  ],
  [Role.MANAGER]: [
    'مدیریت محصولات',
    'مدیریت سفارشات',
    'مشاهده کاربران',
    'مشاهده گزارشات',
  ],
  [Role.ACCOUNTANT]: [
    'مشاهده گزارشات مالی',
    'مشاهده تراکنش‌ها',
    'مدیریت فاکتورها',
  ],
  [Role.WERHOUSE_MANAGER]: [
    'مدیریت انبار',
    'مدیریت موجودی محصولات',
    'مشاهده سفارشات',
  ],
  [Role.STAFF]: [
    'مشاهده سفارشات',
    'پشتیبانی مشتریان',
  ],
  [Role.USER]: ['خرید محصولات', 'مشاهده سفارشات خود'],
};

@Injectable()
export class UserAdminServices {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) { }

  /**
   * اطلاعات ادمین لاگین‌کرده + لیست دسترسی‌هایش
   */
  async getSelfInfo(currentUser: RequestUser): Promise<IAdminSelfInfo> {
    const user = await this.userRepo.findOne({
      where: { id: currentUser.id },
      select: [
        'id', 'firstName', 'lastName', 'phone',
        'email', 'role', 'isActive', 'avatarUrl', 'createdAt',
      ],
    });

    if (!user) throw new NotFoundException('کاربر یافت نشد.');

    return {
      id: user.id,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      phone: user.phone ?? null,
      email: user.email ?? null,
      role: user.role,
      isActive: user.isActive,
      avatarUrl: user.avatarUrl ?? null,
      createdAt: user.createdAt.toISOString(),
      permissions: ROLE_PERMISSIONS[user.role] ?? [],
    };
  }

  /**
   * ساخت کاربر جدید با نقش مشخص
   * - SUPER_ADMIN: می‌تواند هر نقشی بسازد
   * - ADMIN: فقط نقش‌های پایین‌تر (Manager, Accountant, Staff, ...)
   * - بقیه: دسترسی ندارند
   */
  async createUserWithRole(
    currentUser: RequestUser,
    dto: CreateAdminUserDto,
  ): Promise<ICreatedUserResponse> {
    const callerRole = currentUser.role;

    // Role.USER از این مسیر ساخته نمی‌شود
    if (dto.role === Role.USER) {
      throw new ForbiddenException('کاربر عادی از این مسیر ساخته نمی‌شود.');
    }

    // بررسی اینکه آیا کاربر اصلاً مجاز به ساخت کاربر هست
    if (callerRole === Role.USER || callerRole === Role.STAFF) {
      throw new ForbiddenException('شما مجاز به ایجاد کاربر نیستید.');
    }

    // ADMIN فقط می‌تواند نقش‌های مشخص بسازد
    if (
      callerRole === Role.ADMIN &&
      SUPER_ADMIN_ONLY_ROLES.includes(dto.role)
    ) {
      throw new ForbiddenException(
        `ادمین نمی‌تواند کاربر با نقش "${dto.role}" بسازد. فقط سوپرادمین این دسترسی را دارد.`,
      );
    }

    // نقش‌هایی که فقط SUPER_ADMIN می‌تواند بسازد
    if (
      callerRole !== Role.SUPER_ADMIN &&
      SUPER_ADMIN_ONLY_ROLES.includes(dto.role)
    ) {
      throw new ForbiddenException(
        `ایجاد کاربر با نقش "${dto.role}" فقط توسط سوپرادمین امکان‌پذیر است.`,
      );
    }

    // بررسی تکراری نبودن شماره
    if (dto.phone) {
      const existPhone = await this.userRepo.findOne({ where: { phone: dto.phone } });
      if (existPhone) throw new BadRequestException('این شماره موبایل قبلاً ثبت شده است.');
    }

    // بررسی تکراری نبودن ایمیل
    if (dto.email) {
      const existEmail = await this.userRepo.findOne({ where: { email: dto.email } });
      if (existEmail) throw new BadRequestException('این ایمیل قبلاً ثبت شده است.');
    }

    const newUser = this.userRepo.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      email: dto.email,
      password: dto.password,  // هش توسط @BeforeInsert در entity انجام می‌شود
      role: dto.role,
      isActive: true,
    });

    const saved = await this.userRepo.save(newUser);

    return {
      id: saved.id,
      firstName: saved.firstName ?? null,
      lastName: saved.lastName ?? null,
      phone: saved.phone ?? null,
      email: saved.email ?? null,
      role: saved.role,
      isActive: saved.isActive,
      createdAt: saved.createdAt.toISOString(),
    };
  }

  /**
   * لیست کاربران با نقش‌های ادمینی (فقط برای SUPER_ADMIN)
   */

  async getAdminByid(currentUser: RequestUser, id: number) {
    const adminRoles = [
      Role.SUPER_ADMIN,
      Role.ADMIN,
      Role.MANAGER,
      Role.ACCOUNTANT,
      Role.WERHOUSE_MANAGER,
      Role.STAFF,
    ];
    if (currentUser.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('فقط سوپرادمین می‌تواند اطلاعات ادمین‌ها را ببیند.');
    }

    const admin = await this.userRepo.findOne({
      where: {
        id, role: In([...adminRoles])
      },
      select: [
        'id', 'firstName', 'lastName', 'phone',
        'email', 'role', 'isActive', 'createdAt',
      ],
    });

    if (!admin) {
      throw new NotFoundException('ادمین مورد نظر یافت نشد.');
    }

    return {
      id: admin.id,
      firstName: admin.firstName ?? null,
      lastName: admin.lastName ?? null,
      phone: admin.phone ?? null,
      email: admin.email ?? null,
      role: admin.role,
      isActive: admin.isActive,
      createdAt: admin.createdAt.toISOString(),
      permissions: ROLE_PERMISSIONS[admin.role] ?? [],
    };
  }

  async getAdminUsers(currentUser: RequestUser) {
    if (currentUser.role !== Role.SUPER_ADMIN && currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException('فقط سوپرادمین می‌تواند لیست ادمین‌ها را ببیند.');
    }

    const adminRoles = [
      Role.SUPER_ADMIN,
      Role.ADMIN,
      Role.MANAGER,
      Role.ACCOUNTANT,
      Role.WERHOUSE_MANAGER,
      Role.STAFF,
    ];

    const admins = await this.userRepo
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.firstName',
        'user.lastName',
        'user.phone',
        'user.email',
        'user.role',
        'user.isActive',
        'user.createdAt',
      ])
      .where('user.role IN (:...roles)', { roles: adminRoles })
      .orderBy('user.createdAt', 'DESC')
      .getMany();

    return admins.map((u) => ({
      id: u.id,
      firstName: u.firstName ?? null,
      lastName: u.lastName ?? null,
      phone: u.phone ?? null,
      email: u.email ?? null,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt.toISOString(),
      permissions: ROLE_PERMISSIONS[u.role] ?? [],
    }));
  }

  /**
   * لیست همه نقش‌ها و دسترسی‌هایشان
   */
  getAllRolesWithPermissions() {
    return Object.entries(ROLE_PERMISSIONS).map(([role, permissions]) => ({
      role,
      permissions,
    }));
  }
}
