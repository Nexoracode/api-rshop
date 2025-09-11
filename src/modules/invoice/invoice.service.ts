import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';
import { Order, OrderStatus } from '../order/entities/order.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';


function generateInvoiceNumber() {
    const now = new Date();
    // نمونه: INV-20250826-123456
    return `INV-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 1_000_000)}`;
}

@Injectable()
export class InvoiceService {
    constructor(
        @InjectRepository(Invoice) private readonly invoiceRepo: Repository<Invoice>,
        @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    ) { }


    async create(dto: CreateInvoiceDto) {
        const order = await this.orderRepo.findOne({ where: { id: dto.orderId } });
        if (!order) throw new NotFoundException('سفارش یافت نشد.');


        const exists = await this.invoiceRepo.findOne({ where: { order: { id: order.id } } });
        if (exists) throw new BadRequestException('این فاکتور موجود می باشد.');


        const invoice = this.invoiceRepo.create({
            order,
            number: generateInvoiceNumber(),
            status: InvoiceStatus.ISSUED,
            total: order.total,
            paidAmount: 0,
        });
        return this.invoiceRepo.save(invoice);
    }

    async markPaid(invoiceId: string, gatewayRef?: string) {
        const inv = await this.invoiceRepo.findOne({ where: { id: invoiceId }, relations: ['order'] });
        if (!inv) throw new NotFoundException('فاکتور یافت نشد.');


        inv.status = InvoiceStatus.PAID;
        inv.paidAmount = inv.total;
        inv.paidAt = new Date();
        await this.invoiceRepo.save(inv);


        // به‌روزرسانی سفارش
        inv.order.status = OrderStatus.PAID;
        if (gatewayRef) (inv.order as any).paymentGatewayRef = gatewayRef;
        await this.orderRepo.save(inv.order);


        return inv;
    }


    async getByOrder(orderId: string) {
        return this.invoiceRepo.findOne({ where: { order: { id: orderId } } });
    }
}