import express from "express";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import catastoRoutes from "../../src/routes/catasto.routes.js";
import { errorHandler, notFoundHandler } from "../../src/middlewares/error.middleware.js";

/** Le rotte del catasto su una porta libera, con gli stessi middleware del server. */
export async function startApp(): Promise<{ base: string; close: () => Promise<void> }> {
  const app = express();
  app.use(express.json({ limit: "64kb" }));
  app.use("/api/catasto", catastoRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  const server: Server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  return {
    base: `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/catasto`,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}
