import { Request, Response, NextFunction } from "express";

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({ error: "Risorsa non trovata" });
};

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // body-parser e altri middleware usano `status` o `statusCode`.
  const rawStatus = Number(err?.status ?? err?.statusCode);
  const statusCode = rawStatus >= 400 && rawStatus < 600 ? rawStatus : 500;
  const isServerError = statusCode >= 500;
  const isProduction = process.env.NODE_ENV === "production";

  // Gli stack servono solo per i 5xx: un 400 di validazione è un input
  // sbagliato del client, non un problema da indagare.
  if (isServerError) {
    console.error("❌ Error:", err?.stack ?? err);
  } else {
    console.warn(`⚠️  ${statusCode}: ${err?.message}`);
  }

  // 4xx messages (validation, not-found, etc.) are written by us and are
  // safe/useful to show. 5xx messages can leak internals (DB errors, stack
  // traces from third-party calls) so they're masked in production.
  const message =
    isServerError && isProduction
      ? "Internal Server Error"
      : err?.message || "Internal Server Error";

  res.status(statusCode).json({
    error: message,
    stack: isProduction ? undefined : err?.stack,
  });
};
