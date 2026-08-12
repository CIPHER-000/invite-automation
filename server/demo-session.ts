import type { Express } from "express";
import cookieSession from "cookie-session";

export type DemoSessionData = {
  userId?: string;
  email?: string;
  createdAt?: string;
};

declare module "express-serve-static-core" {
  interface Request {
    session: DemoSessionData | null;
  }
}

export function configureDemoSession(app: Express) {
  app.use(
    cookieSession({
      name: "shady-demo-session",
      keys: [process.env.SESSION_SECRET || "shady-5-session-secret-key"],
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    }),
  );
}

export function setSessionUser(
  req: Express["request"],
  user: { id: string; email: string; createdAt: string },
) {
  req.session = {
    userId: user.id,
    email: user.email,
    createdAt: user.createdAt,
  };
}

export function clearDemoSession(req: Express["request"]) {
  req.session = null;
}

export function getSessionUser(req: Express["request"]) {
  if (!req.session?.userId || !req.session.email) {
    return null;
  }
  return {
    id: req.session.userId,
    email: req.session.email,
    createdAt: req.session.createdAt || new Date().toISOString(),
  };
}
