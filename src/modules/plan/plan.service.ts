import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Plan } from './plan.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PlanService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
  ) {}

  findOne(id: string) {
    if (!id) return null;
    return this.planRepository.findOne({ where: { id } });
  }

  async findAll() {
    const plans = await this.planRepository
      .createQueryBuilder('plans')
      .leftJoinAndSelect('plans.llm', 'llm')
      .where('plans.outdated = 0')
      .getMany();
    return plans;
  }
}
