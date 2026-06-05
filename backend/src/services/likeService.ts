import { query, transaction } from '../db';

export async function toggleLike(storyId: string, userId: string): Promise<{ liked: boolean; likes: number }> {
  return await transaction(async (client) => {
    const existing = await client.query(
      'SELECT id FROM likes WHERE story_id = $1 AND user_id = $2',
      [storyId, userId]
    );

    if (existing.rows.length > 0) {
      // 取消点赞
      await client.query(
        'DELETE FROM likes WHERE story_id = $1 AND user_id = $2',
        [storyId, userId]
      );
      await client.query(
        'UPDATE stories SET likes_count = likes_count - 1 WHERE id = $1',
        [storyId]
      );
    } else {
      // 添加点赞
      await client.query(
        'INSERT INTO likes (story_id, user_id) VALUES ($1, $2)',
        [storyId, userId]
      );
      await client.query(
        'UPDATE stories SET likes_count = likes_count + 1 WHERE id = $1',
        [storyId]
      );
    }

    const countResult = await client.query<{ likes_count: number }>(
      'SELECT likes_count FROM stories WHERE id = $1',
      [storyId]
    );

    return { liked: existing.rows.length === 0, likes: countResult.rows[0]?.likes_count ?? 0 };
  });
}

export async function toggleFavorite(storyId: string, userId: string): Promise<{ bookmarked: boolean }> {
  return await transaction(async (client) => {
    const existing = await client.query(
      'SELECT id FROM favorites WHERE story_id = $1 AND user_id = $2',
      [storyId, userId]
    );

    if (existing.rows.length > 0) {
      await client.query(
        'DELETE FROM favorites WHERE story_id = $1 AND user_id = $2',
        [storyId, userId]
      );
      await client.query(
        'UPDATE stories SET favorites_count = favorites_count - 1 WHERE id = $1',
        [storyId]
      );
      return { bookmarked: false };
    } else {
      await client.query(
        'INSERT INTO favorites (story_id, user_id) VALUES ($1, $2)',
        [storyId, userId]
      );
      await client.query(
        'UPDATE stories SET favorites_count = favorites_count + 1 WHERE id = $1',
        [storyId]
      );
      return { bookmarked: true };
    }
  });
}

export async function hasLiked(storyId: string, userId: string): Promise<boolean> {
  const result = await query(
    'SELECT id FROM likes WHERE story_id = $1 AND user_id = $2',
    [storyId, userId]
  );
  return result.rows.length > 0;
}

export async function hasFavorited(storyId: string, userId: string): Promise<boolean> {
  const result = await query(
    'SELECT id FROM favorites WHERE story_id = $1 AND user_id = $2',
    [storyId, userId]
  );
  return result.rows.length > 0;
}
