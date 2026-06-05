import { Router, Request, Response } from 'express';
import { success, error } from '../middleware/response';
import * as shareService from '../services/shareService';
import * as storyService from '../services/storyService';

const router = Router();

// POST /api/share — 生成分享链接
router.post('/', async (req: Request, res: Response) => {
  try {
    const { storyId, chapterId } = req.body;

    if (!storyId) {
      error(res, 400, 'INVALID_INPUT', 'Missing storyId');
      return;
    }

    const story = await storyService.getStoryById(storyId);
    if (!story) {
      error(res, 404, 'NOT_FOUND', 'Story not found');
      return;
    }

    const shareLink = await shareService.createShareLink(storyId, chapterId);
    success(res, {
      code: shareLink.code,
      url: `/share/${shareLink.code}`,
      storyId: shareLink.story_id,
      chapterId: shareLink.chapter_id,
    });
  } catch (err) {
    console.error('Create share error:', err);
    error(res, 500, 'SHARE_FAILED', 'Failed to create share link');
  }
});

// GET /api/share/:code — 通过分享码获取故事
router.get('/:code', async (req: Request, res: Response) => {
  try {
    const shareLink = await shareService.getShareLinkByCode(req.params.code);
    if (!shareLink) {
      error(res, 404, 'NOT_FOUND', 'Share link not found');
      return;
    }

    const story = await storyService.getStoryById(shareLink.story_id);
    if (!story) {
      error(res, 404, 'NOT_FOUND', 'Story not found');
      return;
    }

    success(res, {
      story,
      entryChapterId: shareLink.chapter_id,
    });
  } catch (err) {
    console.error('Get share error:', err);
    error(res, 500, 'FETCH_FAILED', 'Failed to fetch shared story');
  }
});

export default router;
