import { query } from '../db';
import { Feedback, FeedbackType, FeedbackStatus, DeviceInfo } from '../types';

export async function createFeedback(
  type: FeedbackType,
  content: string,
  screenshot: string | undefined,
  routePath: string | undefined,
  deviceInfo: DeviceInfo | undefined,
  userId: string | undefined
): Promise<Feedback> {
  const result = await query<Feedback>(
    `INSERT INTO feedback (type, content, screenshot, page_path, device_info, user_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [type, content, screenshot || null, routePath || null, deviceInfo ? JSON.stringify(deviceInfo) : null, userId || null]
  );
  return result.rows[0];
}

export async function listFeedback(
  page = 1,
  pageSize = 20,
  status?: FeedbackStatus,
  type?: FeedbackType
): Promise<{ feedback: Feedback[]; total: number }> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }
  if (type) {
    values.push(type);
    conditions.push(`type = $${values.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM feedback ${whereClause}`,
    values
  );

  const offset = (page - 1) * pageSize;
  const result = await query<Feedback>(
    `SELECT * FROM feedback ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, pageSize, offset]
  );

  return {
    feedback: result.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
}

export async function updateFeedbackStatus(
  id: string,
  status: FeedbackStatus
): Promise<Feedback | null> {
  const result = await query<Feedback>(
    'UPDATE feedback SET status = $1 WHERE id = $2 RETURNING *',
    [status, id]
  );
  return result.rows[0] || null;
}
