// 自定义装饰器：提供一种机制来将某些有该注解的接口不校验 token
import { SetMetadata } from '@nestjs/common';

export const NOT_CHECK_TOKEN_FLAG = 'not_check_token_flag';
/**
 * 允许 接口 不校验 token
 */
export const NotCheckToken = () => SetMetadata(NOT_CHECK_TOKEN_FLAG, true); // 将CheckTokenFlag 置为 true
