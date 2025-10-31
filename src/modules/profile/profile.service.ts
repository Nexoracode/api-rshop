import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { Order } from '../order/entities/order.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) { }
}
