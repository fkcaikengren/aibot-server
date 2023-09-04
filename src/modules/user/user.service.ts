import { User } from './user.entity';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { EmailRegisterUserDto, UserDto } from 'src/dto/entities.dto';
import { PaginatedDto } from 'src/dto/paginated.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { randomString } from 'src/utils/string.util';
import { EMAIL_REGEX } from 'src/constant';
import { LLMService } from '../llm/llm.service';
import { BalanceService } from '../balance/balance.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly llmService: LLMService,
    private readonly balanceService: BalanceService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache, // 参考：https://hackernoon.com/using-redis-streams-with-nestjs-part-1-setup
  ) {}

  async register(user: EmailRegisterUserDto) {
    const { email, password, emailCode, inviteCode } = user;
    const nickname = randomString(8);
    // 验证参数
    if (!EMAIL_REGEX.test(email)) {
      throw new HttpException('邮箱不正确', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    if (!password || password.length < 6) {
      throw new HttpException('密码至少6位', HttpStatus.UNPROCESSABLE_ENTITY);
    }
    if (!emailCode) {
      throw new HttpException(
        '邮箱验证码不能为空',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    // 验证邮箱验证码
    const code = await this.cacheManager.get(email);

    const isCodeCorrect = emailCode === code;
    if (!isCodeCorrect) {
      throw new HttpException(
        '邮箱验证码错误',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    // 验证用户是否已存在
    const existed = await this.isEmailExisted(email);
    if (existed) {
      throw new HttpException('邮箱已被注册', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    // 计算初始token数量
    let ownTokens = 10000; //起步1w
    if (inviteCode === 'AjpcdqfE') {
      ownTokens += 20000;
    } else if (inviteCode === 'BwvilqfZ') {
      ownTokens += 30000;
    }

    // 创建用户
    const newUser = this.userRepository.create({ ...user, nickname });
    // 创建balance
    try {
      await this.userRepository.save(newUser);
      const allModels = await this.llmService.findAll();
      allModels.forEach(async (model) => {
        await this.balanceService.putOne({
          userId: newUser.id,
          llmId: model.id,
          amount: model.name === 'gpt-3.5-turbo' ? ownTokens : 0,
        });
      });
    } catch (error) {
      console.log(error);
    }

    return { success: true };
  }

  async isEmailExisted(email: string) {
    if (!email) return null;
    const existUser = await this.userRepository.findOne({
      where: { email },
    });
    return !!existUser;
  }

  async findAll(queryParams: {
    role: string;
    email: string;
    phone: string;
    status: string;
    sort: string;
    page: number;
    pageSize: number;
  }): Promise<PaginatedDto<User>> {
    const { role, email, phone, status, sort, page, pageSize } = queryParams;

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
    const [users, total] = await this.userRepository.findAndCount({
      where: {
        ...(!!role && { role }),
        ...(!!email && { email: Like(`%${email}%`) }),
        ...(!!phone && { phone: Like(`%${phone}%`) }),
        ...(!!status && { status }),
      },
      order: {
        updatedAt: sort === 'desc' ? 'DESC' : 'ASC',
      },
      skip: page * pageSize,
      take: pageSize,
    });
    return { total, results: users };
  }

  async findOne(id: string) {
    if (!id) return null;
    return this.userRepository.findOne({ where: { id } });
  }

  async findOneByEmail(email: string): Promise<UserDto> {
    if (!email) return null;
    return this.userRepository
      .createQueryBuilder('user')
      .where('email = :email', { email })
      .addSelect('user.password')
      .addSelect('user.salt')
      .getOne();
  }

  async findOneWithBalance(id: string) {
    if (!id) return null;
    const user = await this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.nickname',
        'user.email',
        'user.phone',
        'user.avatar',
      ])
      .leftJoinAndSelect('user.balances', 'balance')
      .leftJoinAndSelect('balance.llm', 'llm')
      .where('user.id = :uid', { uid: id })
      .getOne();

    return user;
  }

  async saveOne(user: UserDto) {
    return this.userRepository.save(user);
  }
}
