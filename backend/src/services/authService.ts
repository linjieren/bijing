import { query, transaction } from '../db';

const CODE_TTL_MINUTES = 5;

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getExpiresAt(): Date {
  return new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);
}

// 当前为 mock 实现，真实环境需接入阿里云/腾讯云/Twilio 等 SMS 服务商
async function sendSms(phone: string, code: string): Promise<boolean> {
  console.log(`[SMS MOCK] Sending code ${code} to ${phone}`);
  // TODO: 接入真实 SMS 服务商
  return true;
}

export async function sendVerificationCode(phone: string): Promise<{ sent: boolean; mockCode?: string }> {
  const code = generateCode();
  const expiresAt = getExpiresAt();

  await query(
    'INSERT INTO verification_codes (phone, code, expires_at) VALUES ($1, $2, $3)',
    [phone, code, expiresAt]
  );

  const sent = await sendSms(phone, code);

  // 非生产环境把 code 也返回，方便测试
  const isDev = process.env.NODE_ENV !== 'production';
  return { sent, ...(isDev ? { mockCode: code } : {}) };
}

export async function verifyCode(phone: string, code: string): Promise<boolean> {
  return await transaction(async (client) => {
    const result = await client.query(
      `SELECT id FROM verification_codes
       WHERE phone = $1 AND code = $2 AND used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [phone, code]
    );

    if (result.rows.length === 0) {
      return false;
    }

    await client.query(
      'UPDATE verification_codes SET used = TRUE WHERE id = $1',
      [result.rows[0].id]
    );

    return true;
  });
}

export async function bindPhoneToUser(
  anonymousId: string,
  phone: string
): Promise<{ id: string; anonymous_id: string; nickname?: string; avatar_color?: string; phone?: string }> {
  return await transaction(async (client) => {
    // 检查手机号是否已被绑定
    const existing = await client.query(
      'SELECT * FROM users WHERE phone = $1',
      [phone]
    );

    if (existing.rows.length > 0) {
      // 手机号已存在：把老用户的数据迁移过来，或者报错要求登录
      // MVP 简化：直接报错，不允许重复绑定
      throw new Error('PHONE_ALREADY_BOUND');
    }

    const result = await client.query(
      'UPDATE users SET phone = $1 WHERE anonymous_id = $2 RETURNING *',
      [phone, anonymousId]
    );

    if (result.rows.length === 0) {
      throw new Error('USER_NOT_FOUND');
    }

    return result.rows[0];
  });
}

export async function cleanupExpiredCodes(): Promise<void> {
  await query('DELETE FROM verification_codes WHERE expires_at < NOW()');
}
