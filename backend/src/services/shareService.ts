import { query } from '../db';
import { ShareLink } from '../types';

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createShareLink(
  storyId: string,
  chapterId?: string
): Promise<ShareLink> {
  let code = generateCode();
  let attempts = 0;

  // 防止冲突，最多重试10次
  while (attempts < 10) {
    const existing = await query<ShareLink>(
      'SELECT id FROM share_links WHERE code = $1',
      [code]
    );
    if (existing.rows.length === 0) break;
    code = generateCode();
    attempts++;
  }

  const result = await query<ShareLink>(
    `INSERT INTO share_links (code, story_id, chapter_id)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [code, storyId, chapterId || null]
  );
  return result.rows[0];
}

export async function getShareLinkByCode(code: string): Promise<ShareLink | null> {
  const result = await query<ShareLink>(
    'SELECT * FROM share_links WHERE code = $1',
    [code]
  );
  return result.rows[0] || null;
}
