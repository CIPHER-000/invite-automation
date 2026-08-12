import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import session from "express-session";
import connectPg from "connect-pg-simple";
import createMemoryStore from "memorystore";
import { registerRoutes } from "./routes";
import { registerPreviewRoutes } from "./preview-routes";
import { setupVite, serveStatic, log } from "./vite";
import { gmailAppPasswordService } from "./services/gmail-app-password";

export { log };

export async function createServerApp(app: Express): Promise<Server> {
  const isProduction = process.env.NODE_ENV === "production";
  const hasDatabase = Boolean(process.env.DATABASE_URL);

  if (hasDatabase) {
    const pgStore = connectPg(session);
    const sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false,
      ttl: 7 * 24 * 60 * 60,
      tableName: "sessions",
    });

    app.use(
      session({
        secret: process.env.SESSION_SECRET || "shady-5-session-secret-key",
        store: sessionStore,
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: isProduction,
          maxAge: 7 * 24 * 60 * 60 * 1000,
          httpOnly: true,
        },
      }),
    );
  } else {
    console.warn("DATABASE_URL not set — using preview mode with in-memory sessions");
    const MemoryStore = createMemoryStore(session);
    app.use(
      session({
        secret: process.env.SESSION_SECRET || "shady-5-session-secret-key",
        store: new MemoryStore({ checkPeriod: 86400000 }),
        resave: false,
        saveUninitialized: true,
        cookie: {
          secure: isProduction,
          maxAge: 7 * 24 * 60 * 60 * 1000,
          httpOnly: true,
        },
      }),
    );
  }

  let server: Server;

  if (hasDatabase) {
    await gmailAppPasswordService.initialize();

    console.log("Starting connection monitoring service...");
    const { connectionMonitorService } = await import("./services/connection-monitor");
    connectionMonitorService.startMonitoring();

    server = await registerRoutes(app);
  } else {
    server = registerPreviewRoutes(app);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  if (!isProduction) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  return server;
}
