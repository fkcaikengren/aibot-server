export const EMAIL_REGEX =
  /^[A-Za-z0-9]+([_\.][A-Za-z0-9]+)*@([A-Za-z0-9\-]+\.)+[A-Za-z]{2,6}$/;

// 字段
//  '支付方式：1微信、2支付宝、3线下（转账）、4借记卡、5信用卡',
export enum ORDER_PAYMENT_TYPE {
  Wechat = 1,
  Alipay = 2,
  Offline = 3,
  DebitCard = 4,
  CreditCard = 5,
}

// '状态：1未付款、2已付款、3退款中、4已退款',
export enum ORDER_STATUS {
  NotPay = 1,
  CompletePay = 2,
  Refunding = 3,
  CompleteRefund = 4,
}
