import { Router, Request, Response } from 'express';
import { success, error } from '../middleware/response';
import * as userService from '../services/userService';

const router = Router();

// GET /api/users/me — 当前用户资料
router.get('/me', async (req: Request, res: Response) => {
  try {
    const user = req.currentUser;
    if (!user) {
      error(res, 401, 'UNAUTHORIZED', 'Not authenticated');
      return;
    }

    const profile = await userService.getUserProfile(user.id);
    if (!profile) {
      error(res, 404, 'NOT_FOUND', 'User not found');
      return;
    }

    success(res, profile);
  } catch (err) {
    console.error('Get profile error:', err);
    error(res, 500, 'FETCH_FAILED', 'Failed to fetch user profile');
  }
});

// GET /api/users/me/stories — 我的故事列表
router.get('/me/stories', async (req: Request, res: Response) => {
  try {
    const user = req.currentUser;
    if (!user) {
      error(res, 401, 'UNAUTHORIZED', 'Not authenticated');
      return;
    }

    const stories = await userService.getUserStories(user.id);
    success(res, stories);
  } catch (err) {
    console.error('Get my stories error:', err);
    error(res, 500, 'FETCH_FAILED', 'Failed to fetch stories');
  }
});

// GET /api/users/me/likes — 我喜欢的故事
router.get('/me/likes', async (req: Request, res: Response) => {
  try {
    const user = req.currentUser;
    if (!user) {
      error(res, 401, 'UNAUTHORIZED', 'Not authenticated');
      return;
    }

    const stories = await userService.getUserLikedStories(user.id);
    success(res, stories);
  } catch (err) {
    console.error('Get liked stories error:', err);
    error(res, 500, 'FETCH_FAILED', 'Failed to fetch liked stories');
  }
});

// GET /api/users/me/favorites — 我收藏的故事
router.get('/me/favorites', async (req: Request, res: Response) => {
  try {
    const user = req.currentUser;
    if (!user) {
      error(res, 401, 'UNAUTHORIZED', 'Not authenticated');
      return;
    }

    const stories = await userService.getUserFavoritedStories(user.id);
    success(res, stories);
  } catch (err) {
    console.error('Get favorited stories error:', err);
    error(res, 500, 'FETCH_FAILED', 'Failed to fetch favorited stories');
  }
});

export default router;
