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
      // 自动创建匿名用户
      const insert = await query<User>(
        'INSERT INTO users (anonymous_id) VALUES ($1) RETURNING *',
        [anonymousId]
      );
      req.currentUser = insert.rows[0];
    }
  } catch (err) {
    console.error('User middleware error:', err);
  }

  next();
}
