import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Express 4 non intercetta le Promise rifiutate: senza questo wrapper ogni
 * controller asincrono dovrebbe ripetere il proprio try/catch con next(error).
 */
export const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    handler(req, res, next).catch(next);
  };
