import { Request, Response, NextFunction } from 'express';

/**
 * Global error-handling middleware.
 * Catches any unhandled errors and returns a consistent JSON response.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[error]', err.message);

  const status = (err as any).statusCode || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal server error',
  });
}
