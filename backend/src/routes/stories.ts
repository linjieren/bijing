import { Router, Request, Response } from 'express';
import { success, error } from '../middleware/response';
import * as storyService from '../services/storyService';
import * as chapterService from '../services/chapterService';
import * as likeService from '../services/likeService';
import * as aiService from '../services/aiService';
import { StoryStyle, StoryLength } from '../types';

const router = Router();

const VALID_STYLES: StoryStyle[] = ['古风', '科幻', '悬疑', '言情', '职场', '无限流', '末日'];
const VALID_LENGTHS: StoryLength[] = ['short', 'medium', 'long'];

// POST /api/stories — 创建新故事
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, setting, style, lengthPreference } = req.body;
    const user = req.currentUser;

    if (!user) {
      error(res, 401, 'UNAUTHORIZED', 'Missing anonymous user');
      return;
    }
    if (!title || !setting || !style) {
      error(res, 400, 'INVALID_INPUT', 'Missing required fields: title, setting, style');
      return;
    }
    if (!VALID_STYLES.includes(style)) {
      error(res, 400, 'INVALID_STYLE', `Style must be one of: ${VALID_STYLES.join(', ')}`);
      return;
    }
    if (lengthPreference && !VALID_LENGTHS.includes(lengthPreference)) {
      error(res, 400, 'INVALID_LENGTH', `Length must be one of: ${VALID_LENGTHS.join(', ')}`);
      return;
    }

    const story = await storyService.createStory(title, setting, style, user.id, lengthPreference);
    success(res, story);
  } catch (err) {
    console.error('Create story error:', err);
    error(res, 500, 'CREATE_FAILED', 'Failed to create story');
  }
});

// GET /api/stories — 获取"我的故事"列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.currentUser;
    if (!user) {
      error(res, 401, 'UNAUTHORIZED', 'Missing anonymous user');
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const result = await storyService.getStoriesByAuthor(user.id, { page, pageSize });
    success(res, { stories: result.stories, total: result.total }, { page, pageSize });
  } catch (err) {
    console.error('List stories error:', err);
    error(res, 500, 'LIST_FAILED', 'Failed to list stories');
  }
});

// GET /api/stories/liked — 获取我喜欢的故事列表
router.get('/liked', async (req: Request, res: Response) => {
  try {
    const user = req.currentUser;
    if (!user) {
      error(res, 401, 'UNAUTHORIZED', 'Missing anonymous user');
      return;
    }
    const stories = await likeService.getLikedStories(user.id);
    success(res, stories);
  } catch (err) {
    console.error('List liked stories error:', err);
    error(res, 500, 'LIST_FAILED', 'Failed to list liked stories');
  }
});

// GET /api/stories/favorited — 获取我收藏的故事列表
router.get('/favorited', async (req: Request, res: Response) => {
  try {
    const user = req.currentUser;
    if (!user) {
      error(res, 401, 'UNAUTHORIZED', 'Missing anonymous user');
      return;
    }
    const stories = await likeService.getFavoritedStories(user.id);
    success(res, stories);
  } catch (err) {
    console.error('List favorited stories error:', err);
    error(res, 500, 'LIST_FAILED', 'Failed to list favorited stories');
  }
});

// GET /api/stories/random-prompt — 随机设定（必须在 /:id 之前）
router.get('/random-prompt', (_req: Request, res: Response) => {
  const prompt = aiService.getRandomPrompt();
  success(res, { prompt });
});

// GET /api/stories/:id — 获取故事详情和全部章节
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const story = await storyService.getStoryById(req.params.id);
    if (!story) {
      error(res, 404, 'NOT_FOUND', 'Story not found');
      return;
    }

    await storyService.incrementReadCount(story.id);
    success(res, story);
  } catch (err) {
    console.error('Get story error:', err);
    error(res, 500, 'FETCH_FAILED', 'Failed to fetch story');
  }
});

// DELETE /api/stories/:id — 删除故事
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const user = req.currentUser;
    if (!user) {
      error(res, 401, 'UNAUTHORIZED', 'Missing anonymous user');
      return;
    }

    const deleted = await storyService.deleteStory(req.params.id, user.id);
    if (!deleted) {
      error(res, 404, 'NOT_FOUND', 'Story not found or not authorized');
      return;
    }

    success(res, { deleted: true });
  } catch (err) {
    console.error('Delete story error:', err);
    error(res, 500, 'DELETE_FAILED', 'Failed to delete story');
  }
});

// POST /api/stories/:id/chapters — 生成下一章
router.post('/:id/chapters', async (req: Request, res: Response) => {
  try {
    const { previousChapterId, userChoice } = req.body;
    const storyId = req.params.id;
    const isStream = req.query.stream === 'true';

    const story = await storyService.getStoryById(storyId);
    if (!story) {
      if (!isStream) {
        error(res, 404, 'NOT_FOUND', 'Story not found');
      } else {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Story not found' } });
      }
      return;
    }

    // 如果故事已完结，禁止继续生成
    if (story.status === 'completed') {
      if (!isStream) {
        error(res, 400, 'STORY_COMPLETED', 'Story is already completed');
      } else {
        res.status(400).json({ success: false, error: { code: 'STORY_COMPLETED', message: 'Story is already completed' } });
      }
      return;
    }

    let previousChapter = null;
    if (previousChapterId) {
      previousChapter = await chapterService.getChapterById(previousChapterId);
      if (!previousChapter || previousChapter.story_id !== storyId) {
        if (!isStream) {
          error(res, 400, 'INVALID_CHAPTER', 'Previous chapter not found');
        } else {
          res.status(400).json({ success: false, error: { code: 'INVALID_CHAPTER', message: 'Previous chapter not found' } });
        }
        return;
      }
    }

    const currentChapterCount = story.chapters?.length || 0;
    const nextSequence = currentChapterCount + 1;

    if (!isStream) {
      // 同步模式
      const generated = await aiService.generateNextChapter(
        story.title,
        story.setting,
        story.style,
        previousChapter,
        userChoice !== undefined ? parseInt(userChoice) : null,
        story.length_preference || undefined,
        nextSequence,
        story.max_chapters || undefined
      );

      // 检测完结：AI 标记 或 硬完结（章节数达到上限）
      const isHardFinale = story.max_chapters ? nextSequence >= story.max_chapters : false;
      const isFinale = generated.isFinale || isHardFinale;

      const chapter = await chapterService.createChapter(
        storyId,
        nextSequence,
        generated.title,
        generated.content,
        generated.choices,
        generated.worldState,
        isFinale
      );

      // 如果完结，更新故事状态
      if (isFinale) {
        await storyService.updateStoryStatus(storyId, 'completed');
      }

      success(res, { ...chapter, is_finale: isFinale, story_status: isFinale ? 'completed' : story.status });
      return;
    }

    // 流式模式
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const generated = await aiService.generateNextChapterStream(
      story.title,
      story.setting,
      story.style,
      previousChapter,
      userChoice !== undefined ? parseInt(userChoice) : null,
      (chunk) => {
        res.write(`data: ${JSON.stringify({ type: 'content', chunk })}
\n`);
      },
      story.length_preference || undefined,
      nextSequence,
      story.max_chapters || undefined
    );

    // 检测完结
    const isHardFinale = story.max_chapters ? nextSequence >= story.max_chapters : false;
    const isFinale = generated.isFinale || isHardFinale;

    const chapter = await chapterService.createChapter(
      storyId,
      nextSequence,
      generated.title,
      generated.content,
      generated.choices,
      generated.worldState,
      isFinale
    );

    // 如果完结，更新故事状态
    if (isFinale) {
      await storyService.updateStoryStatus(storyId, 'completed');
    }

    res.write(`data: ${JSON.stringify({ type: 'done', chapter: { ...chapter, is_finale: isFinale, story_status: isFinale ? 'completed' : story.status } })}
\n`);
    res.end();
  } catch (err) {
    console.error('Generate chapter error:', err);
    if (req.query.stream === 'true') {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to generate chapter' })}
\n`);
      res.end();
    } else {
      error(res, 500, 'GENERATE_FAILED', 'Failed to generate chapter');
    }
  }
});

// POST /api/stories/:id/regenerate — 回退到某章重新生成
router.post('/:id/regenerate', async (req: Request, res: Response) => {
  try {
    const { chapterId } = req.body;
    const storyId = req.params.id;
    const user = req.currentUser;

    if (!user) {
      error(res, 401, 'UNAUTHORIZED', 'Missing anonymous user');
      return;
    }
    if (!chapterId) {
      error(res, 400, 'INVALID_INPUT', 'Missing chapterId');
      return;
    }

    const rolledBack = await storyService.rollbackToChapter(storyId, chapterId);
    if (!rolledBack) {
      error(res, 404, 'NOT_FOUND', 'Chapter not found in this story');
      return;
    }

    success(res, { regenerated: true, rolledBackTo: chapterId });
  } catch (err) {
    console.error('Regenerate error:', err);
    error(res, 500, 'REGENERATE_FAILED', 'Failed to regenerate');
  }
});

// POST /api/stories/:id/publish — 发布到广场
router.post('/:id/publish', async (req: Request, res: Response) => {
  try {
    const user = req.currentUser;
    if (!user) {
      error(res, 401, 'UNAUTHORIZED', 'Missing anonymous user');
      return;
    }

    // 发布到广场需要绑定手机号
    if (!user.phone) {
      error(res, 403, 'PHONE_REQUIRED', '请先绑定手机号后再发布');
      return;
    }

    const story = await storyService.publishStory(req.params.id, user.id);
    if (!story) {
      error(res, 404, 'NOT_FOUND', 'Story not found or not authorized');
      return;
    }

    success(res, story);
  } catch (err) {
    console.error('Publish story error:', err);
    error(res, 500, 'PUBLISH_FAILED', 'Failed to publish story');
  }
});

// POST /api/stories/:id/like — 点赞
router.post('/:id/like', async (req: Request, res: Response) => {
  try {
    const user = req.currentUser;
    if (!user) {
      error(res, 401, 'UNAUTHORIZED', 'Missing anonymous user');
      return;
    }

    const result = await likeService.toggleLike(req.params.id, user.id);
    success(res, result);
  } catch (err) {
    console.error('Toggle like error:', err);
    error(res, 500, 'LIKE_FAILED', 'Failed to toggle like');
  }
});

// POST /api/stories/:id/favorite — 收藏
router.post('/:id/favorite', async (req: Request, res: Response) => {
  try {
    const user = req.currentUser;
    if (!user) {
      error(res, 401, 'UNAUTHORIZED', 'Missing anonymous user');
      return;
    }

    const result = await likeService.toggleFavorite(req.params.id, user.id);
    success(res, result);
  } catch (err) {
    console.error('Toggle favorite error:', err);
    error(res, 500, 'FAVORITE_FAILED', 'Failed to toggle favorite');
  }
});

export default router;
