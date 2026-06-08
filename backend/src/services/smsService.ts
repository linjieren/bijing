export interface SMSProvider {
  send(phone: string, code: string): Promise<void>;
}

class MockSMSProvider implements SMSProvider {
  async send(_phone: string, _code: string): Promise<void> {
    // Dev 环境不做真实发送
    console.log(`[MockSMS] Would send code ${_code} to ${_phone}`);
  }
}

class AliyunSMSProvider implements SMSProvider {
  async send(_phone: string, _code: string): Promise<void> {
    // TODO: 接入阿里云短信服务
    throw new Error('阿里云短信服务未实现');
  }
}

function createProvider(): SMSProvider {
  const provider = process.env.SMS_PROVIDER || 'mock';
  switch (provider) {
    case 'aliyun':
      return new AliyunSMSProvider();
    case 'mock':
    default:
      return new MockSMSProvider();
  }
}

export const smsProvider = createProvider();
