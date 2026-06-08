import { query } from '../db';
import { Event, EventType } from '../types';

export interface CreateEventInput {
  event_type: EventType;
  story_id?: string;
  chapter_id?: string;
  metadata?: Record<string, unknown>;
}

export async function createEvents(
  userId: string | undefined,
  inputs: CreateEventInput[]
): Promise<Event[]> {
  const results: Event[] = [];

  for (const input of inputs) {
    const result = await query<Event>(
      `INSERT INTO events (event_type, user_id, story_id, chapter_id, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        input.event_type,
        userId || null,
        input.story_id || null,
        input.chapter_id || null,
        input.metadata ? JSON.stringify(input.metadata) : '{}',
      ]
    );
    results.push(result.rows[0]);
  }

  return results;
}

export async function getUserEventSummary(
  userId: string
): Promise<Record<string, number>> {
  const result = await query<{ event_type: string; count: string }>(
    `SELECT event_type, COUNT(*) as count
     FROM events
     WHERE user_id = $1
     GROUP BY event_type`,
    [userId]
  );

  const summary: Record<string, number> = {};
  for (const row of result.rows) {
    summary[row.event_type] = parseInt(row.count, 10);
  }
  return summary;
}
