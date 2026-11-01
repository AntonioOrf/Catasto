import app from "./app.js";
import pool from "./config/db.js";
import { NotificaService } from "./services/notifica.service.js";

const PORT = process.env.PORT || 3005;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
  NotificaService.logConfigurazione();
});

// docker stop invia SIGTERM: chiudiamo le connessioni in corso e il pool
// invece di troncare le richieste a metà.
const shutdown = (signal: string) => {
  console.log(`${signal} ricevuto, arresto in corso...`);
  server.close(() => {
    pool.end().finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
