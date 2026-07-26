import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error("❌ Error:", err.message);
  if (err.stack) console.error(err.stack);

  const statusCode = err.status || 500;
  const isServerError = statusCode >= 500;
  const isProduction = process.env.NODE_ENV === "production";

  // 4xx messages (validation, not-found, etc.) are written by us and are
  // safe/useful to show. 5xx messages can leak internals (DB errors, stack
  // traces from third-party calls) so they're masked in production.
  const message =
    isServerError && isProduction
      ? "Internal Server Error"
      : err.message || "Internal Server Error";

  res.status(statusCode).json({
    error: message,
    stack: isProduction ? undefined : err.stack,
  });
};
