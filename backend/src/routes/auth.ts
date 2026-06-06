import { Router, Request, Response } from 'express';
import { success, error } from '../middleware/response';
import * as authService from '../services/authService';

const router = Router();

// GET /api/auth/version — 调试用，确认部署版本
router.get('/version', (_req: Request, res: Response) => {
  res.json({ version: '2026-06-06-v2', hasSmsProvider: !!process.env.SMS_PROVIDER });
});

// POST /api/auth/send-code — 发送验证码
router.post('/send-code', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      error(res, 400, 'INVALID_PHONE', '请输入有效的手机号');
      return;
    }

    const result = await authService.sendVerificationCode(phone);
    success(res, { sent: result.sent });
  } catch (err) {
    console.error('Send code error:', err);
    error(res, 500, 'SEND_FAILED', 'Failed to send verification code');
  }
});

// POST /api/auth/verify — 验证手机号并绑定
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { phone, code } = req.body;
    const user = req.currentUser;

    if (!user) {
      error(res, 401, 'UNAUTHORIZED', 'Missing anonymous user');
      return;
    }
    if (!phone || !code) {
      error(res, 400, 'INVALID_INPUT', 'Missing phone or code');
      return;
    }

    const valid = await authService.verifyCode(phone, code);
    if (!valid) {
      error(res, 400, 'INVALID_CODE', '验证码错误或已过期');
      return;
    }

    const updatedUser = await authService.bindPhoneToUser(user.anonymous_id, phone);
    success(res, updatedUser);
  } catch (err) {
    console.error('Verify error:', err);
    const msg = err instanceof Error ? err.message : 'Verification failed';
    if (msg === 'PHONE_ALREADY_BOUND') {
      error(res, 409, 'PHONE_ALREADY_BOUND', '该手机号已被绑定');
      return;
    }
    error(res, 500, 'VERIFY_FAILED', 'Failed to verify phone');
  }
});

export default router;
