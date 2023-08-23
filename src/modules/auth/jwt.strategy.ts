import { UserService } from './../user/user.service';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

const jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();

// 当传递给Passport的策略是jwt时，password自动查找JwtStrategy
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userService: UserService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {
    super({
      jwtFromRequest,
      ignoreExpiration: true, // TODO: 有redis缓存了
      secretOrKey: process.env.JWT_SECRET,
      passReqToCallback: true,
    });
  }

  /**
   * 到了validate，说明accessToken是合法的，但不一定正确。
   */
  async validate(req, payload) {
    // 从header中抽取access token
    const token = jwtFromRequest(req);
    // 从redis中获取信息
    const cacheToken = await this.cacheManager.get(`uid:${payload.uid}`);
    // console.log('-------');
    // console.log('token ', token);
    // console.log('cache: ', cacheToken);
    if (!cacheToken) {
      throw new UnauthorizedException('access token已过期'); //定制code, 让前端用refresh来刷新
    }
    if (token != cacheToken) {
      throw new UnauthorizedException('access token不正确，请重新登录');
    }

    // 将accessToken挂到req上
    // req.user = { id: payload.uid };
    return { id: payload.uid, role: payload.role }; //这个返回值回挂到req.user上
  }
}
