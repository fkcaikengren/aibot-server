import { encode } from 'gpt-3-encoder';
const normalChars =
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function randomString(length: number, chars = normalChars) {
  let result = '';
  for (let i = length; i > 0; --i)
    result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}
export function calcTokens(text: string, weight = 1) {
  return Math.ceil(encode(text).length * weight);
}
