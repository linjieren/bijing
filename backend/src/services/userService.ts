import { query } from '../db';
import { User, Story } from '../types';

export interface UserProfile {
  id: string;
  nickname: string;
  avatar_color: string;
  phone?: string;
  stats: {
    storiesCount: number;
    totalLikesReceived: number;
  };
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const userResult = await query<User>(
    'SELECT id, nickname, avatar_color, phone FROM users WHERE id = $1',
    [userId]
  );
  if (userResult.rows.length === 0) return null;

  const user = userResult.rows[0];

  const statsResult = await query<
    { stories_count: string; total_likes: string }
  >(
    `SELECT COUNT(*) as stories_count, COALESCE(SUM(likes_count), 0) as total_likes
     FROM stories WHERE author_id = $1`,
    [userId]
  );

  return {
    id: user.id,
    nickname: user.nickname || '匿名用户',
    avatar_color: user.avatar_color || '#8B5CF6',
    phone: user.phone,
    stats: {
      storiesCount: parseInt(statsResult.rows[0].stories_count, 10),
      totalLikesReceived: parseInt(statsResult.rows[0].total_likes, 10),
    },
  };
}

export async function getUserStories(userId: string): Promise<Story[]> {
  const result = await query<Story>(
    `SELECT * FROM stories
     WHERE author_id = $1 AND status IN ('ongoing', 'completed')
     ORDER BY updated_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function getUserLikedStories(userId: string): Promise<Story[]> {
  const result = await query<Story>(
    `SELECT s.* FROM stories s
     INNER JOIN likes l ON s.id = l.story_id
     WHERE l.user_id = $1
     ORDER BY l.created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function getUserFavoritedStories(userId: string): Promise<Story[]> {
  const result = await query<Story>(
    `SELECT s.* FROM stories s
     INNER JOIN favorites f ON s.id = f.story_id
     WHERE f.user_id = $1
     ORDER BY f.created_at DESC`,
    [userId]
  );
  return result.rows;
}
