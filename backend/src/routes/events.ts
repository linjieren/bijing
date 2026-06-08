import { Router, Request, Response } from 'express';
import { success, error } from '../middleware/response';
import * as eventService from '../services/eventService';
import { EventType } from '../types';

const router = Router();

const VALID_EVENT_TYPES: EventType[] = [
  'story_created',
  'chapter_read',
  'choice_made',
  'story_abandoned',
  'story_completed',
  'story_shared',
  'new_story_started',
];

// POST /api/events — 批量接收事件
router.post('/', async (req: Request, res: Response) => {
  try {
    const events = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      error(res, 400, 'INVALID_INPUT', 'Expected an array of events');
      return;
    }

    if (events.length > 50) {
      error(res, 400, 'TOO_MANY_EVENTS', 'Max 50 events per batch');
      return;
    }

    // 校验每条事件
    for (const ev of events) {
      if (!ev.event_type || !VALID_EVENT_TYPES.includes(ev.event_type)) {
        error(res, 400, 'INVALID_EVENT_TYPE', `Invalid event_type: ${ev.event_type}`);
        return;
      }
    }

    const user = req.currentUser;
    const created = await eventService.createEvents(
      user?.id,
      events.map((ev) => ({
        event_type: ev.event_type,
        story_id: ev.story_id,
        chapter_id: ev.chapter_id,
        metadata: ev.metadata,
      }))
    );

    success(res, { created: created.length });
  } catch (err) {
    console.error('Create events error:', err);
    error(res, 500, 'CREATE_FAILED', 'Failed to create events');
  }
});

// GET /api/events/summary — 当前用户事件统计
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const user = req.currentUser;
    if (!user) {
      error(res, 401, 'UNAUTHORIZED', 'Not authenticated');
      return;
    }

    const summary = await eventService.getUserEventSummary(user.id);
    success(res, summary);
  } catch (err) {
    console.error('Event summary error:', err);
    error(res, 500, 'FETCH_FAILED', 'Failed to fetch event summary');
  }
});

export default router;
