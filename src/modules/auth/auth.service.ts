import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EmailLoginUserDto } from 'src/dto/entities.dto';
import { UserService } from '../user/user.service';
import { AuthUserDto } from './../../dto/entities.dto';

import * as nodemailer from 'nodemailer';
import { randomString } from '../../utils/string.util';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { encryptPassword } from 'src/utils/crypto.util';
import { EMAIL_REGEX } from 'src/constant';

@Injectable()
export class AuthService {
  private readonly emailer: nodemailer.Transporter;
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {
    this.emailer = nodemailer.createTransport({
      host: 'smtp.163.com',
      port: 465,
      secure: true, // use TLS
      auth: {
        user: this.configService.get('EMAIL_SENDER'),
        pass: this.configService.get('EMAIL_PASS'), //'MOGWGSBFZQJWBWZH', //授权码
      },
      tls: {
        // do not fail on invalid certs
        rejectUnauthorized: false,
      },
    });
  }

  /** 登录 */
  async login(user: EmailLoginUserDto): Promise<AuthUserDto> {
    const { email, password } = user;
    const authUser = await this.validateUser(email, password);
    if (!authUser)
      throw new HttpException(
        '邮箱不存在或密码错误',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    const payload = {
      uid: authUser.id,
      role: authUser.role,
    };
    const token = this.jwtService.sign(payload);
    //删除一些属性
    delete authUser.password;
    delete authUser.salt;
    delete authUser.status;
    delete authUser.role;
    delete authUser.createdAt;
    delete authUser.updatedAt;
    const loginUser = {
      ...authUser,
      accessToken: token,
      refreshToken: this.jwtService.sign(payload, {
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
      }),
    };
    //保存到redis
    // @ts-ignore (cache-manager-redis-store 期望ttl传入一个obj)
    await this.cacheManager.set(`uid:${payload.uid}`, token, {
      ttl: this.configService.get('AUTH_MAX_AGE'),
    });

    return loginUser;
  }

  /* 验证用户 */
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findOneByEmail(email);
    if (user && user.password === encryptPassword(password, user.salt)) {
      return user;
    }
    return null;
  }

  /** 发送邮件验证码*/
  async sendEmailCode(emailAddr: string) {
    // email格式验证
    if (!EMAIL_REGEX.test(emailAddr)) {
      throw new HttpException('邮箱不正确', HttpStatus.UNPROCESSABLE_ENTITY);
    }
    const code = randomString(6, '0123456789');
    //发送邮件
    const mail = {
      from: `"踩坑人AI"<caikengren_ai@163.com>`, // 发件人
      subject: '验证码', //邮箱主题
      to: emailAddr, //收件人
      // 邮件内容，用html格式编写
      html: `
          <p>您好！</p>
          <p>您的验证码是：<strong style="color:orangered;">${code}</strong></p>
          <p>如果不是您本人操作，请无视此邮件</p>
      `,
    };

    return new Promise((resolve, reject) => {
      this.emailer.sendMail(mail, (err, info) => {
        if (err) {
          reject(err);
        } else {
          // 保存到Cache
          this.cacheManager
            // @ts-ignore
            .set(emailAddr, code, { ttl: 120 }) // 120s
            .then(() => {
              // 验证码发送成功
              resolve(info);
            })
            .catch((err) => {
              reject(err);
            });
        }
      });
    });
  }

  /** 重新生成token */
  async regenerateAccessToken(refreshToken: string) {
    try {
      const { uid } = this.jwtService.verify(refreshToken);
      const user = await this.userService.findOne(uid);
      if (!user) {
        throw new Error('user not exist');
      }
      const token = this.jwtService.sign({
        uid: user.id,
        role: user.role,
      });
      //保存到redis
      // @ts-ignore (cache-manager-redis-store 期望ttl传入一个obj)
      await this.cacheManager.set(`uid:${uid}`, token, {
        ttl: this.configService.get('AUTH_MAX_AGE'),
      });
      return { accessToken: token };
    } catch (error) {
      // console.log(error);
      throw new HttpException('身份过期，请重新登录', HttpStatus.UNAUTHORIZED);
    }
  }
}
