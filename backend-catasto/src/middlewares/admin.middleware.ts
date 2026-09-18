import { timingSafeEqual } from "node:crypto";
import { Request, Response, NextFunction } from "express";

/**
 * Autenticazione della sola area di moderazione. Non c'è un sistema utenti: la
 * redazione è una persona con un token condiviso, e ammettere questo
 * esplicitamente è meglio che simulare un login.
 *
 * Senza ADMIN_TOKEN configurato le rotte sono chiuse (403), non aperte: una
 * variabile d'ambiente dimenticata non deve esporre le segnalazioni.
 */
const safeCompare = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    res.status(403).json({ error: "Area di moderazione non configurata" });
    return;
  }

  const header = req.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token || !safeCompare(token, expected)) {
    res.status(401).json({ error: "Non autorizzato" });
    return;
  }

  next();
};
