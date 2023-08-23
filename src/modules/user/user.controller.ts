import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';

import { EmailRegisterUserDto, UserDto } from 'src/dto/entities.dto';
import { PaginatedDto } from 'src/dto/paginated.dto';

import { UserService } from './user.service';
import { NotCheckToken } from 'src/decorators/not-check-token.decorator';
import { BalanceService } from '../balance/balance.service';
import { Roles } from 'src/decorators/roles.decorator.ts';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly balanceService: BalanceService,
  ) {}

  @NotCheckToken()
  @Post()
  register(@Body() user: EmailRegisterUserDto) {
    return this.userService.register(user);
  }

  @Roles('admin')
  @Get()
  listUsers(
    @Query()
    queryParams: {
      role: string;
      email: string;
      phone: string;
      status: string;
      sort: string;
      page: number;
      pageSize: number;
    },
  ): Promise<PaginatedDto<UserDto>> {
    return this.userService.findAll(queryParams);
  }

  @Get('balance')
  findOneWithBalance(@Req() req: any): Promise<UserDto> {
    const { id } = req.user;
    return this.userService.findOneWithBalance(id);
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<UserDto> {
    return this.userService.findOne(id);
  }
}
