import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { LLM } from '../llm/llm.entity';
import { Balance } from './balance.entity';
import { BalanceDto } from 'src/dto/entities.dto';

@Injectable()
export class BalanceService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(LLM) private llmRepository: Repository<LLM>,
    @InjectRepository(Balance)
    private balanceRepository: Repository<Balance>,
  ) {}

  async putOne(balance: BalanceDto): Promise<Balance> {
    const { userId, llmId, amount } = balance;
    let newBalance = await this.balanceRepository.findOne({
      where: {
        userId,
        llmId,
      },
    });
    if (newBalance) {
      // 修改
      newBalance = this.balanceRepository.merge(newBalance, {
        total: amount + (newBalance.total - newBalance.used),
        used: 0,
      });
    } else {
      // 创建
      const user = await this.userRepository.findOne({ where: { id: userId } });
      const llm = await this.llmRepository.findOne({ where: { id: llmId } });
      if (!user || !llm) {
        throw new HttpException(
          'userId or llmId is not valid',
          HttpStatus.BAD_REQUEST,
        );
      }
      newBalance = this.balanceRepository.create({
        userId: user.id,
        llmId: llm.id,
        total: amount,
        used: 0,
      });
    }

    return this.balanceRepository.save(newBalance);
  }

  // 找到一个
  async findOne(userId: string, llmId: string) {
    return this.balanceRepository.findOne({
      where: {
        userId,
        llmId,
      },
    });
  }

  // 修改used
  async updateUsed(userId: string, modelId: string, consumed: number) {
    let newBalance = await this.balanceRepository.findOne({
      where: {
        userId,
        llmId: modelId,
      },
    });
    if (!newBalance) {
      return null;
      // throw new HttpException('balance not exist', HttpStatus.BAD_REQUEST);
    }

    // 修改
    newBalance = this.balanceRepository.merge(newBalance, {
      used: newBalance.used + consumed,
    });

    return this.balanceRepository.save(newBalance);
  }
}
