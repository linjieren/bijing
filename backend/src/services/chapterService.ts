import { query } from '../db';
import { Chapter, WorldState, ChoiceOption } from '../types';

export async function createChapter(
  storyId: string,
  sequence: number,
  title: string,
  content: string,
  choices: ChoiceOption[],
  worldState: WorldState,
  isFinale = false
): Promise<Chapter> {
  const result = await query<Chapter>(
    `INSERT INTO chapters (story_id, sequence, title, content, choices, world_state, is_finale)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [storyId, sequence, title, content, JSON.stringify(choices), JSON.stringify(worldState), isFinale]
  );
  return result.rows[0];
}

export async function getChaptersByStory(storyId: string): Promise<Chapter[]> {
  const result = await query<Chapter>(
    'SELECT * FROM chapters WHERE story_id = $1 ORDER BY sequence ASC',
    [storyId]
  );
  return result.rows;
}

export async function getChapterById(id: string): Promise<Chapter | null> {
  const result = await query<Chapter>(
    'SELECT * FROM chapters WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

export async function getLastChapter(storyId: string): Promise<Chapter | null> {
  const result = await query<Chapter>(
    'SELECT * FROM chapters WHERE story_id = $1 ORDER BY sequence DESC LIMIT 1',
    [storyId]
  );
  return result.rows[0] || null;
}

export async function getNextSequence(storyId: string): Promise<number> {
  const result = await query<{ max: number | null }>(
    'SELECT MAX(sequence) as max FROM chapters WHERE story_id = $1',
    [storyId]
  );
  return (result.rows[0].max || 0) + 1;
}
