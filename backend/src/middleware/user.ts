import { Request, Response, NextFunction } from 'express';
import { query } from '../db';
import { User } from '../types';

// 扩展 Express Request 类型
declare global {
  namespace Express {
    interface Request {
      currentUser?: User;
    }
  }
}

const NICKNAMES = [
  '墨尘', '青衣客', '云游子', '竹影', '折扇书生', '夜归人', '醉月', '听雨',
  '孤舟', '寒江', '落英', '抚琴', '衔烛', '踏雪', '枕霞', '煮酒',
  '问剑', '寻梅', '观澜', '拾翠', '飞白', '留白', '疏影', '暗香',
];

const AVATAR_COLORS = [
  '#8B5CF6', '#06B6D4', '#F59E0B', '#EF4444', '#10B981',
  '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#84CC16',
];

function getRandomNickname(): string {
  return NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)];
}

function getRandomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

export async function userMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const anonymousId = req.headers['x-anonymous-id'] as string;

  if (!anonymousId) {
    next();
    return;
  }

  try {
    const result = await query<User>(
      'SELECT * FROM users WHERE anonymous_id = $1',
      [anonymousId]
    );

    if (result.rows.length > 0) {
      req.currentUser = result.rows[0];
    } else {
      const nickname = getRandomNickname();
      const avatarColor = getRandomAvatarColor();
      const insert = await query<User>(
        'INSERT INTO users (anonymous_id, nickname, avatar_color) VALUES ($1, $2, $3) RETURNING *',
        [anonymousId, nickname, avatarColor]
      );
      req.currentUser = insert.rows[0];
    }
  } catch (err) {
    console.error('User middleware error:', err);
  }

  next();
}
