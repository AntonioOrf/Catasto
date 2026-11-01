import express, { type Express, type RequestHandler } from "express";
import path from "node:path";
import { notFoundHandler } from "./middlewares/error.middleware.js";

/**
 * Intestazioni di sicurezza della SPA (le stesse di vercel.json). Sostituiscono
 * quelle di helmet sulle risposte del frontend: la CSP di default di helmet
 * contiene upgrade-insecure-requests, che servendo il sito in http (es.
 * http://server:1427) farebbe chiedere gli asset in https e li romperebbe.
 * Le immagini dei manoscritti arrivano dal server IIIF dell'Archivio (host
 * indicato nel manifest), quindi img-src ammette https:; il browser parla
 * solo con il proprio backend, quindi connect-src resta 'self'.
 */
export const FRONTEND_SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Cross-Origin-Opener-Policy": "same-origin",
};

const securityHeaders: RequestHandler = (_req, res, next) => {
  for (const [name, value] of Object.entries(FRONTEND_SECURITY_HEADERS)) res.setHeader(name, value);
  next();
};

/** Le rotte del backend: non vanno mai risolte con index.html. */
const isBackendPath = (p: string) => p === "/health" || p === "/api" || p.startsWith("/api/");

/**
 * Serve la build del frontend (Vite) dallo stesso processo dell'API, al posto
 * di nginx. Va montato dopo le rotte /api e prima del notFoundHandler.
 *
 * - /assets/*: file con hash nel nome, cache immutabile di un anno; un asset
 *   mancante è un 404, non index.html (un bundle vecchio deve fallire, non
 *   ricevere HTML al posto del JS).
 * - altri file statici (favicon, theme-init.js) e index.html: no-cache, così
 *   dopo un aggiornamento il browser non chiede bundle che non esistono più.
 * - ogni altra GET fuori da /api: index.html (routing lato client).
 */
export function serveFrontend(app: Express, dir: string): void {
  const root = path.resolve(dir);
  const noCache = (res: express.Response) => res.setHeader("Cache-Control", "no-cache");

  app.use((req, res, next) => (isBackendPath(req.path) ? next() : securityHeaders(req, res, next)));

  app.use(
    "/assets",
    express.static(path.join(root, "assets"), { immutable: true, maxAge: "1y", index: false }),
    notFoundHandler,
  );
  app.use(express.static(root, { index: false, setHeaders: noCache }));

  app.get("*", (req, res, next) => {
    if (isBackendPath(req.path)) return next();
    noCache(res);
    res.sendFile("index.html", { root }, (err) => err && next(err));
  });
}
