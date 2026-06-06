import { query, transaction } from '../db';
import { Story, StoryWithChapters, Chapter, StoryListQuery, StoryStyle } from '../types';

export async function createStory(
  title: string,
  setting: string,
  style: StoryStyle,
  authorId: string
): Promise<Story> {
  const result = await query<Story>(
    `INSERT INTO stories (title, setting, style, author_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [title, setting, style, authorId]
  );
  return result.rows[0];
}

export async function getStoryById(id: string): Promise<StoryWithChapters | null> {
  const storyResult = await query<Story>(
    `SELECT s.*, u.nickname as author_nickname, u.avatar_color as author_avatar_color
     FROM stories s
     JOIN users u ON s.author_id = u.id
     WHERE s.id = $1`,
    [id]
  );
  if (storyResult.rows.length === 0) return null;

  const chapterResult = await query<Chapter>(
    'SELECT * FROM chapters WHERE story_id = $1 ORDER BY sequence ASC',
    [id]
  );

  return {
    ...storyResult.rows[0],
    chapters: chapterResult.rows,
  };
}

export async function getStoriesByAuthor(
  authorId: string,
  queryParams: StoryListQuery
): Promise<{ stories: Story[]; total: number }> {
  const page = queryParams.page || 1;
  const pageSize = queryParams.pageSize || 20;
  const offset = (page - 1) * pageSize;

  const countResult = await query<{ count: string }>(
    'SELECT COUNT(*) FROM stories WHERE author_id = $1',
    [authorId]
  );

  const result = await query<Story>(
    `SELECT s.*, u.nickname as author_nickname, u.avatar_color as author_avatar_color
     FROM stories s
     JOIN users u ON s.author_id = u.id
     WHERE s.author_id = $1
     ORDER BY s.updated_at DESC
     LIMIT $2 OFFSET $3`,
    [authorId, pageSize, offset]
  );

  return {
    stories: result.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
}

export async function deleteStory(id: string, authorId: string): Promise<boolean> {
  return await transaction(async (client) => {
    const result = await client.query<Story>(
      'DELETE FROM stories WHERE id = $1 AND author_id = $2 RETURNING *',
      [id, authorId]
    );
    return result.rows.length > 0;
  });
}

export async function updateStoryStatus(
  id: string,
  status: 'ongoing' | 'completed' | 'abandoned'
): Promise<Story | null> {
  const result = await query<Story>(
    'UPDATE stories SET status = $1 WHERE id = $2 RETURNING *',
    [status, id]
  );
  return result.rows[0] || null;
}

export async function publishStory(
  id: string,
  authorId: string
): Promise<Story | null> {
  const result = await query<Story>(
    "UPDATE stories SET is_public = TRUE WHERE id = $1 AND author_id = $2 RETURNING *",
    [id, authorId]
  );
  return result.rows[0] || null;
}

export async function incrementReadCount(storyId: string): Promise<void> {
  await query(
    'UPDATE stories SET reads_count = reads_count + 1 WHERE id = $1',
    [storyId]
  );
}

// 回退到某章节，删除后续章节
export async function rollbackToChapter(
  storyId: string,
  chapterId: string
): Promise<boolean> {
  return await transaction(async (client) => {
    // 先找到目标章节的 sequence
    const targetResult = await client.query<Chapter>(
      'SELECT sequence FROM chapters WHERE id = $1 AND story_id = $2',
      [chapterId, storyId]
    );
    if (targetResult.rows.length === 0) return false;

    const targetSequence = targetResult.rows[0].sequence;

    // 删除后续章节
    await client.query(
      'DELETE FROM chapters WHERE story_id = $1 AND sequence > $2',
      [storyId, targetSequence]
    );

    // 更新故事状态为 ongoing
    await client.query(
      "UPDATE stories SET status = 'ongoing' WHERE id = $1",
      [storyId]
    );

    return true;
  });
}
