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
      orderBy = 'created_at DESC';
      break;
    case 'favorites':
      orderBy = 'favorites_count DESC, created_at DESC';
      break;
    case 'hot':
    default:
      // 综合热度 = 点赞 * 2 + 收藏 * 3 + 阅读 * 0.1
      orderBy = '(likes_count * 2 + favorites_count * 3 + reads_count * 0.1) DESC, created_at DESC';
      break;
  }

  const conditions: string[] = ["status = 'ongoing'"];
  const values: unknown[] = [];

  if (category) {
    values.push(category);
    conditions.push(`style = $${values.length}`);
  }

  const whereClause = conditions.join(' AND ');

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM stories WHERE ${whereClause}`,
    values
  );

  const result = await query<Story>(
    `SELECT * FROM stories WHERE ${whereClause}
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
     WHERE status = 'ongoing'
     GROUP BY style
     ORDER BY count DESC`
  );

  return result.rows.map(r => ({
    name: r.style,
    count: parseInt(r.count, 10),
  }));
}

export async function getHotSettings(): Promise<string[]> {
  // 从热门故事的设定中提取前10个
  const result = await query<{ setting: string }>(
    `SELECT setting FROM stories
     WHERE status = 'ongoing'
     ORDER BY (likes_count * 2 + favorites_count * 3 + reads_count * 0.1) DESC
     LIMIT 10`
  );

  return result.rows.map(r => r.setting);
}
