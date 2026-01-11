import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Support, SupportStatus } from './entities/support.entity';
import { Message } from './entities/message.entity';
import { CreateSupportDto } from './dto/create-support.dto';
import { CreateProductSupportDto } from './dto/create-product-support.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateAdminReplyDto } from './dto/create-admin-reply.dto';
import { RequestUser } from 'src/common/interfaces/request-user.interface';
import { runInTransaction } from 'src/common/helpers/transaction.helper';
import { SupportMapper } from './mappers/support.mapper';
import { Product } from '../product/entities/product.entity';
import { includeRole } from './decorators/include-role.decorator';
import { Role } from 'src/common/enums/role.enum';
import { FilterOperator, paginate, PaginateQuery } from 'nestjs-paginate';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(Support)
    private readonly supportRepo: Repository<Support>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) { }

  // 🟢 ایجاد گفت‌وگو عمومی
  async create(user: RequestUser, dto: CreateSupportDto) {
    return runInTransaction(this.dataSource, async (manager) => {
      const support = manager.create(Support, {
        user,
        subject: dto.subject,
      });
      await manager.save(Support, support);

      const message = manager.create(Message, {
        support,
        senderId: user.id,
        content: dto.content,
      });
      await manager.save(Message, message);

      const result = await manager.findOne(Support, {
        where: { id: support.id },
        relations: ['user', 'messages', 'messages.sender'],
      });
      return SupportMapper.toResponse(result!);
    });
  }

  // 🟢 ایجاد گفت‌وگو مرتبط با محصول
  async createForProduct(user: RequestUser, dto: CreateProductSupportDto) {
    return runInTransaction(this.dataSource, async (manager) => {
      const product = await manager.findOne(Product, {
        where: { id: dto.productId },
      });
      if (!product) throw new NotFoundException('محصول یافت نشد');

      const support = manager.create(Support, {
        userId: user.id,
        productId: product.id,
        subject: dto.subject || `گفتگو درباره ${product.name}`,
      });
      await manager.save(Support, support);

      const message = manager.create(Message, {
        support,
        senderId: user.id,
        content: dto.message,
      });
      await manager.save(Message, message);

      const result = await manager.findOne(Support, {
        where: { id: support.id },
        relations: ['user', 'product', 'messages', 'messages.sender'],
      });
      return SupportMapper.toResponse(result!);
    });
  }

  // 🟢 دریافت همه گفتگوهای کاربر
  async findAllByUser(user: RequestUser) {
    const qb = this.supportRepo
      .createQueryBuilder('support')
      .where('support.userId = :userId', { userId: user.id })
      .leftJoinAndSelect('support.product', 'product')
      .leftJoinAndSelect('support.messages', 'messages')
      .leftJoinAndSelect('messages.sender', 'sender')
      .orderBy('support.updatedAt', 'DESC');

    includeRole(qb, ['sender']);

    const supports = await qb.getMany();
    return supports.map(SupportMapper.toResponse);
  }

  // 🟢 دریافت جزئیات گفت‌وگو برای کاربر
  async findOneByUser(user: RequestUser, id: number) {
    const qb = this.supportRepo
      .createQueryBuilder('support')
      .where('support.id = :id', { id })
      .andWhere('support.userId = :userId', { userId: user.id })
      .leftJoinAndSelect('support.product', 'product')
      .leftJoinAndSelect('support.messages', 'messages')
      .leftJoinAndSelect('messages.sender', 'sender');

    includeRole(qb, ['sender']);

    const support = await qb.getOne();
    if (!support) throw new NotFoundException('گفتگو یافت نشد');
    return SupportMapper.toResponse(support);
  }

  async addMessageByUser(user: RequestUser, dto: CreateMessageDto) {
    return await runInTransaction(this.dataSource, async (manager) => {
      // پیدا کردن گفت‌وگو
      const support = await manager.findOne(Support, {
        where: { id: dto.supportId, userId: user.id },
      });

      if (!support) throw new NotFoundException('گفت‌وگو یافت نشد');

      // ساخت پیام جدید
      const message = manager.create(Message, {
        support,
        senderId: user.id,
        content: dto.content,
      });
      await manager.save(Message, message);



      // 👇 به‌روزرسانی وضعیت گفتگو
      if (support.status === SupportStatus.CLOSED) {
        support.status = SupportStatus.OPEN;
      } else {
        support.status = SupportStatus.WAITING; // چون الان کاربر منتظره
      }

      await manager.save(Support, support);

      // خروجی نهایی
      const qb = manager
        .createQueryBuilder(Support, 'support')
        .where('support.id = :id', { id: dto.supportId })
        .leftJoinAndSelect('support.product', 'product')
        .leftJoinAndSelect('support.messages', 'messages')
        .leftJoinAndSelect('messages.sender', 'sender')
        .orderBy('messages.createdAt', 'ASC');

      const updated = await qb.getOne();
      return SupportMapper.toResponse(updated!);
    });
  }

  async closeSupport(user: RequestUser, id: number) {
    const support = await this.supportRepo.findOne({ where: { id, userId: user.id } });
    if (!support) throw new NotFoundException('گفت‌وگو یافت نشد');
    support.status = SupportStatus.CLOSED;
    return this.supportRepo.save(support);
  }



  // 🟢 پاسخ ادمین با rollback ایمن
  async adminReply(admin: RequestUser, supportId: number, dto: CreateAdminReplyDto) {
    if (admin.role !== Role.ADMIN, Role.SUPER_ADMIN && admin.role !== Role.SUPER_ADMIN)
      throw new ForbiddenException('دسترسی مجاز نیست');

    return runInTransaction(this.dataSource, async (manager) => {
      const support = await manager.findOne(Support, {
        where: { id: supportId },
      });
      if (!support) throw new NotFoundException('گفت‌وگو یافت نشد');

      const message = manager.create(Message, {
        support,
        senderId: admin.id,
        content: dto.content,
      });
      await manager.save(Message, message);

      support.status = SupportStatus.ANSWERED;
      await manager.save(Support, support);

      const qb = manager
        .createQueryBuilder(Support, 'support')
        .where('support.id = :id', { id: supportId })
        .leftJoinAndSelect('support.user', 'user')
        .leftJoinAndSelect('support.product', 'product')
        .leftJoinAndSelect('support.messages', 'messages')
        .leftJoinAndSelect('messages.sender', 'sender');

      includeRole(qb, ['sender']);

      const updated = await qb.getOne();
      return SupportMapper.toResponse(updated!);
    });
  }

  // 🟢 مشاهده همه گفتگوها برای ادمین
  async findAllForAdmin(query: PaginateQuery) {
    const paginated = await paginate(query, this.supportRepo, {
      relations: ['user', 'product', 'product.mediaPinned', 'messages', 'messages.support', 'messages.sender'],
      sortableColumns: ['id', 'updatedAt'],
      defaultSortBy: [['updatedAt', 'DESC']],
      searchableColumns: [
        'messages.support.subject',
        'messages.content',
        'user.firstName',
        'user.lastName',
      ],
      filterableColumns: {
        createdAt: [FilterOperator.LTE, FilterOperator.GTE],
        productId: [FilterOperator.EQ],
      },
      maxLimit: 50,
      defaultLimit: 15,
    });

    return {
      items: SupportMapper.toList(paginated.data),
      meta: paginated.meta,
      link: paginated.links,
    }
  }


  // 🟢 مشاهده یک گفت‌وگو برای ادمین
  async findOneForAdmin(id: number) {
    const qb = this.supportRepo
      .createQueryBuilder('support')
      .where('support.id = :id', { id })
      .leftJoinAndSelect('support.user', 'user')
      .leftJoinAndSelect('support.product', 'product')
      .leftJoinAndSelect('product.mediaPinned', 'mediaPinned')
      .leftJoinAndSelect('support.messages', 'messages')
      .leftJoinAndSelect('messages.sender', 'sender');

    includeRole(qb, ['sender']);

    const support = await qb.getOne();
    if (!support) throw new NotFoundException('گفت‌وگو یافت نشد');

    return SupportMapper.toResponse(support);
  }
}
