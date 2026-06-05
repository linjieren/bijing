import { Request, Response, NextFunction } from 'express';
import { error as sendError } from './response';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Unhandled error:', err);
  sendError(res, 500, 'INTERNAL_ERROR', err.message || 'Internal server error');
}

export function notFoundHandler(
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  sendError(res, 404, 'NOT_FOUND', 'Resource not found');
}
