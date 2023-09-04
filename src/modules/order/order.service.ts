import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './order.entity';
import { OrderDto, SaveOrderDto } from 'src/dto/entities.dto';
import { UserService } from '../user/user.service';
import { PlanService } from '../plan/plan.service';
import * as moments from 'moment';
import { BalanceService } from '../balance/balance.service';
import { ORDER_STATUS } from 'src/constant';
import { PaginatedDto } from 'src/dto/paginated.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly userService: UserService,
    private readonly planService: PlanService,
    private readonly balanceService: BalanceService,
  ) {}

  async createOne(orderInfo: SaveOrderDto) {
    // TODO: 添加事务

    // 创建订单
    const curTime = moments().format('YYYYMMDDHHmmss');

    const user = await this.userService.findOne(orderInfo.userId);
    const plan = await this.planService.findOne(orderInfo.planId);

    if (!user || !plan) {
      throw new HttpException(
        '用户或计划不存在',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    if (!user.new && plan.onlyNew) {
      throw new HttpException(
        '该计划仅新用户可购买',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const newOrder = this.orderRepository.create({
      code: curTime + user.id.slice(0, 4) + 'O', // 'O'表示OpenAI公司
      paymentType: orderInfo.paymentType,
      amount: plan.price,
      status: orderInfo.status,
    });

    newOrder.user = user;
    newOrder.plan = plan;

    if (user.new) {
      // 修改新用户
      user.new = false;
    }

    const savedOrder = await this.orderRepository.save(newOrder); //save只会修改orders表，不会修改关联表
    console.log(orderInfo);
    // 修改balance
    if (orderInfo.status === ORDER_STATUS.CompletePay) {
      await this.balanceService.putOne({
        userId: user.id,
        llmId: plan.llmId,
        amount: plan.tokens,
      });
    }

    // 新用户改为老用户
    this.userService.saveOne(user);

    return savedOrder;
  }

  async findAll(queryParams: {
    userId: string;
    planId: string;
    paymentType: number;
    status: number;
    sort: string;
    page: number;
    pageSize: number;
  }): Promise<PaginatedDto<OrderDto>> {
    const { userId, planId, paymentType, status, sort, page, pageSize } =
      queryParams;

    if (typeof page === 'undefined' || page < 0) {
      throw new HttpException(
        '参数page 不正确',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    if (typeof pageSize === 'undefined' || pageSize <= 0) {
      throw new HttpException(
        '参数pageSize 不正确',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    const [orders, total] = await this.orderRepository.findAndCount({
      where: {
        ...(!!userId && { userId }),
        ...(!!planId && { planId }),
        ...(!!paymentType && { paymentType }),
        ...(!!status && { status }),
      },
      order: {
        updatedAt: sort === 'desc' ? 'DESC' : 'ASC',
      },
      skip: page * pageSize,
      take: pageSize,
    });
    return { total, results: orders };
  }

  //通过订单流水号查询
  async findOneByCode(orderCode: string) {
    if (!orderCode) return null;
    return this.orderRepository.findOne({
      where: {
        code: orderCode,
      },
    });
  }

  //统计
  async orderStatistics() {
    const [orders, total] = await this.orderRepository.findAndCount();
    const totalAmount = orders.reduce((acc, order) => acc + order.amount, 0);
    return { totalAmount, total };
  }

  //通过订单流水号删除
  async deleteOne(id: string) {
    if (!id) {
      throw new HttpException('缺少参数id', HttpStatus.BAD_REQUEST);
    }
    const res = await this.orderRepository
      .createQueryBuilder('users')
      .delete()
      .from(Order)
      .where('id = :id', { id })
      .execute();
    if (res.affected <= 0) {
      throw new HttpException('删除失败', HttpStatus.UNPROCESSABLE_ENTITY);
    }
    return res;
  }
}
