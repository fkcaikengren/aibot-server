import { Controller, Get, Req } from '@nestjs/common';
import { PlanService } from './plan.service';
import { UserService } from '../user/user.service';

@Controller('plans')
export class PlanController {
  constructor(
    private readonly planService: PlanService,
    private readonly userService: UserService,
  ) {}

  @Get()
  async listPlans(@Req() req: any) {
    const { id } = req.user;
    const user = await this.userService.findOne(id);
    const plans = await this.planService.findAll();
    if (user.new) return plans;

    return plans.filter((plan) => !plan.onlyNew);
  }
}
