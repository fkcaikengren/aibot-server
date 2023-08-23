import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AuthUserDto, EmailLoginUserDto } from 'src/dto/entities.dto';
import { AuthService } from './auth.service';
import { NotCheckToken } from 'src/decorators/not-check-token.decorator';

interface SuccessDto {
  success: boolean;
}

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**用户邮箱登录 */
  @NotCheckToken()
  @Post('sessions')
  async login(@Body() user: EmailLoginUserDto): Promise<AuthUserDto> {
    return this.authService.login(user);
  }

  /**退出登录 */
  // @Delete('sessions/:id')
  // async logout(@Param('id') id: string) {
  //   // TODOO: 退出登录，清除redis
  //   return { success: true };
  // }

  /**发送邮箱验证码 */
  @NotCheckToken()
  @Get('email_codes/:email')
  async sendEmailCode(@Param('email') email: string): Promise<SuccessDto> {
    await this.authService.sendEmailCode(email);
    return { success: true };
  }

  /**验证access token */
  @Get('verify_token')
  async verifyAccessToken() {
    return { success: true };
  }

  /**刷新 access token */
  @NotCheckToken()
  @Post('refresh_token')
  async refreshAccessToken(@Body('refresh_token') refreshToken) {
    return this.authService.regenerateAccessToken(refreshToken);
  }
}
