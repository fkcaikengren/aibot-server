import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ExtractJwt } from 'passport-jwt';
import { NOT_CHECK_TOKEN_FLAG } from 'src/decorators/not-check-token.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector, // @Inject(CertificationService) // private readonly certificationService: CertificationService,
  ) {
    super();
  }

  canActivate(ctx: ExecutionContext) {
    // console.log(ctx.getHandler);
    // 获取controller中handler的元数据
    const pass = this.reflector.get<boolean>(
      NOT_CHECK_TOKEN_FLAG,
      ctx.getHandler(),
    );
    // console.log('pass: ' + pass);
    if (pass) return true;

    return super.canActivate(ctx);
    // super.canActivate(ctx)中调用了JwtStrategy.validate(ctx), 然后再调用handleRequest
  }

  /**
   *
   * @param err 来自 JwtStrategy.validate函数抛出的错误
   * @param ret 来自 JwtStrategy.validate函数的返回值
   * @returns
   */
  // handleRequest<U>(err, ret: U): U {
  //   if (err) {
  //     console.log(err);
  //     throw err;
  //   }
  //   return ret;
  // }
}
