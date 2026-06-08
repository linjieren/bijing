import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db';
import { User } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'bijing-dev-secret';

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    return payload;
  } catch {
    return null;
  }
}

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    next();
    return;
  }

  try {
    const result = await query<User>(
      'SELECT * FROM users WHERE id = $1',
      [payload.userId]
    );
    if (result.rows.length > 0) {
      // 登录用户优先于匿名用户
      req.currentUser = result.rows[0];
    }
  } catch (err) {
    console.error('Auth middleware error:', err);
  }

  next();
}
