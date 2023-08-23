import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Prompt } from './prompt.entity';
import { PromptDto } from 'src/dto/entities.dto';

@Injectable()
export class PromptService {
  constructor(
    @InjectRepository(Prompt)
    private readonly promptRepository: Repository<Prompt>,
    private dataSource: DataSource,
  ) {}

  async findAll() {
    const prompts = await this.promptRepository
      .createQueryBuilder('prompts')
      .getMany();
    return prompts;
  }

  async createMany(prompts: PromptDto[]) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      for (const prompt of prompts) {
        const entity = new Prompt();
        Object.assign(entity, prompt);
        await queryRunner.manager.save(entity);
      }
      await queryRunner.commitTransaction();
    } catch (err) {
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      console.log(err);
      throw new HttpException('批量创建Prompt失败', HttpStatus.BAD_GATEWAY);
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }
  }
}
