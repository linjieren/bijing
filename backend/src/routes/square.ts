import { Router, Request, Response } from 'express';
import { success, error } from '../middleware/response';
import * as squareService from '../services/squareService';
import * as aiService from '../services/aiService';

const router = Router();

// GET /api/square — 故事广场
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const category = req.query.category as string | undefined;
    const sort = (req.query.sort as 'hot' | 'latest' | 'favorites') || 'hot';

    const result = await squareService.getSquareStories({ page, pageSize, category, sort });
    success(res, result.stories, { page, pageSize, total: result.total });
  } catch (err) {
    console.error('Square error:', err);
    error(res, 500, 'FETCH_FAILED', 'Failed to fetch stories');
  }
});

// GET /api/square/categories — 分类列表和热门设定
router.get('/categories', async (_req: Request, res: Response) => {
  try {
    const [categories, hotSettings] = await Promise.all([
      squareService.getCategories(),
      squareService.getHotSettings(),
    ]);

    success(res, { categories, hotSettings });
  } catch (err) {
    console.error('Categories error:', err);
    error(res, 500, 'FETCH_FAILED', 'Failed to fetch categories');
  }
});

export default router;
