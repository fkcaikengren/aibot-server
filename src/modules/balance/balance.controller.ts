import { Body, Controller, Put } from '@nestjs/common';
import { BalanceService } from './balance.service';
import { BalanceDto } from 'src/dto/entities.dto';

@Controller('balances')
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Put()
  refillBalance(@Body() balance: BalanceDto) {
    return this.balanceService.putOne(balance);
  }
}
