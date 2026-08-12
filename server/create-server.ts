import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { createServer } from "http";
import session from "express-session";
import connectPg from "connect-pg-simple";
import createMemoryStore from "memorystore";
import { registerPreviewRoutes } from "./preview-routes";
import { setupVite, serveStatic, log } from "./vite";
import { gmailAppPasswordService } from "./services/gmail-app-password";

export { log };

type InitOptions = {
  apiOnly?: boolean;
};

async function configureSessions(app: Express, isProduction: boolean, hasDatabase: boolean) {
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
    return;
  }

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

export async function initApp(app: Express, options: InitOptions = {}): Promise<void> {
  const isProduction = process.env.NODE_ENV === "production";
  const hasDatabase = Boolean(process.env.DATABASE_URL);

  await configureSessions(app, isProduction, hasDatabase);

  if (hasDatabase) {
    await gmailAppPasswordService.initialize();

    if (!options.apiOnly) {
      console.log("Starting connection monitoring service...");
      const { connectionMonitorService } = await import("./services/connection-monitor");
      connectionMonitorService.startMonitoring();
    }

    const { registerRoutes } = await import("./routes");
    await registerRoutes(app);
  } else {
    registerPreviewRoutes(app);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
}

export async function createServerApp(app: Express): Promise<Server> {
  await initApp(app);

  const httpServer = createServer(app);
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    await setupVite(app, httpServer);
  } else {
    serveStatic(app);
  }

  return httpServer;
}
