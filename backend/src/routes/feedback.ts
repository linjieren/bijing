import { Router, Request, Response } from 'express';
import { success, error } from '../middleware/response';
import * as feedbackService from '../services/feedbackService';
import { FeedbackType, FeedbackStatus } from '../types';

const router = Router();

const VALID_TYPES: FeedbackType[] = ['bug', 'feature', 'experience', 'other'];
const VALID_STATUSES: FeedbackStatus[] = ['open', 'reviewing', 'accepted', 'rejected', 'resolved'];

// POST /api/feedback — 提交用户反馈
router.post('/', async (req: Request, res: Response) => {
  try {
    const { type, content, screenshot, routePath, deviceInfo } = req.body;

    if (!type || !content) {
      error(res, 400, 'INVALID_INPUT', 'Missing required fields: type, content');
      return;
    }

    if (!VALID_TYPES.includes(type)) {
      error(res, 400, 'INVALID_TYPE', `Type must be one of: ${VALID_TYPES.join(', ')}`);
      return;
    }

    if (content.length > 5000) {
      error(res, 400, 'CONTENT_TOO_LONG', 'Content must be less than 5000 characters');
      return;
    }

    if (screenshot && screenshot.length > 3_000_000) {
      error(res, 400, 'SCREENSHOT_TOO_LARGE', 'Screenshot must be less than ~2MB after base64');
      return;
    }

    const feedback = await feedbackService.createFeedback(
      type,
      content,
      screenshot,
      routePath,
      deviceInfo,
      req.currentUser?.id
    );

    success(res, { id: feedback.id, created: true });
  } catch (err) {
    console.error('Create feedback error:', err);
    error(res, 500, 'CREATE_FAILED', 'Failed to submit feedback');
  }
});

// GET /api/feedback — 查询反馈列表（dev 用）
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);
    const status = req.query.status as FeedbackStatus | undefined;
    const type = req.query.type as FeedbackType | undefined;

    if (status && !VALID_STATUSES.includes(status)) {
      error(res, 400, 'INVALID_STATUS', `Status must be one of: ${VALID_STATUSES.join(', ')}`);
      return;
    }
    if (type && !VALID_TYPES.includes(type)) {
      error(res, 400, 'INVALID_TYPE', `Type must be one of: ${VALID_TYPES.join(', ')}`);
      return;
    }

    const result = await feedbackService.listFeedback(page, pageSize, status, type);
    success(res, result.feedback, { page, pageSize, total: result.total });
  } catch (err) {
    console.error('List feedback error:', err);
    error(res, 500, 'LIST_FAILED', 'Failed to list feedback');
  }
});

// PATCH /api/feedback/:id/status — 更新反馈状态
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!status || !VALID_STATUSES.includes(status)) {
      error(res, 400, 'INVALID_STATUS', `Status must be one of: ${VALID_STATUSES.join(', ')}`);
      return;
    }

    const updated = await feedbackService.updateFeedbackStatus(id, status);
    if (!updated) {
      error(res, 404, 'NOT_FOUND', 'Feedback not found');
      return;
    }

    success(res, updated);
  } catch (err) {
    console.error('Update feedback status error:', err);
    error(res, 500, 'UPDATE_FAILED', 'Failed to update feedback status');
  }
});

export default router;
