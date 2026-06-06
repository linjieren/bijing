import { query } from '../db';
import { Story, StoryListQuery } from '../types';

export async function getSquareStories(
  params: StoryListQuery
): Promise<{ stories: Story[]; total: number }> {
  const page = params.page || 1;
  const pageSize = Math.min(params.pageSize || 20, 50);
  const offset = (page - 1) * pageSize;
  const sort = params.sort || 'hot';
  const category = params.category;

  let orderBy: string;
  switch (sort) {
    case 'latest':
      orderBy = 's.created_at DESC';
      break;
    case 'favorites':
      orderBy = 's.favorites_count DESC, s.created_at DESC';
      break;
    case 'hot':
    default:
      orderBy = '(s.likes_count * 2 + s.favorites_count * 3 + s.reads_count * 0.1) DESC, s.created_at DESC';
      break;
  }

  const conditions: string[] = ["s.status = 'ongoing'", "s.is_public = TRUE"];
  const values: unknown[] = [];

  if (category) {
    values.push(category);
    conditions.push(`s.style = $${values.length}`);
  }

  const whereClause = conditions.join(' AND ');

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM stories s WHERE ${whereClause}`,
    values
  );

  const result = await query<Story>(
    `SELECT s.*, u.nickname as author_nickname, u.avatar_color as author_avatar_color
     FROM stories s
     JOIN users u ON s.author_id = u.id
     WHERE ${whereClause}
     ORDER BY ${orderBy}
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, pageSize, offset]
  );

  return {
    stories: result.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
}

export async function getCategories(): Promise<{ name: string; count: number }[]> {
  const result = await query<{ style: string; count: string }>(
    `SELECT style, COUNT(*) as count
     FROM stories
     WHERE status = 'ongoing' AND is_public = TRUE
     GROUP BY style
     ORDER BY count DESC`
  );

  return result.rows.map(r => ({
    name: r.style,
    count: parseInt(r.count, 10),
  }));
}

export async function getHotSettings(): Promise<string[]> {
  const result = await query<{ setting: string }>(
    `SELECT setting FROM stories
     WHERE status = 'ongoing' AND is_public = TRUE
     ORDER BY (likes_count * 2 + favorites_count * 3 + reads_count * 0.1) DESC
     LIMIT 10`
  );

  return result.rows.map(r => r.setting);
}
