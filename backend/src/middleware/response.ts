import { Response } from 'express';
import { ApiResponse } from '../types';

export function success<T>(res: Response, data: T, meta?: ApiResponse<T>['meta']): void {
  const response: ApiResponse<T> = { success: true, data };
  if (meta) response.meta = meta;
  res.json(response);
}

export function error(res: Response, statusCode: number, code: string, message: string): void {
  const response: ApiResponse = {
    success: false,
    error: { code, message }
  };
  res.status(statusCode).json(response);
}
