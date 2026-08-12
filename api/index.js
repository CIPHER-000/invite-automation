// server/vercel-handler.ts
import "dotenv/config";
import express from "express";
import session from "express-session";
import createMemoryStore from "memorystore";

// server/preview-routes.ts
import { createServer } from "http";
var mockUser = {
  id: "preview-user",
  email: "preview@example.com",
  createdAt: (/* @__PURE__ */ new Date()).toISOString()
};
var emptyStats = {
  activeCampaigns: 0,
  invitesToday: 0,
  dailyLimit: 100,
  acceptedInvites: 0,
  acceptanceRate: 0,
  connectedAccounts: 0,
  apiUsage: 12
};
function registerPreviewRoutes(app2) {
  app2.get("/api/me", (_req, res) => res.json(mockUser));
  app2.get("/api/dashboard/stats", (_req, res) => res.json(emptyStats));
  app2.get("/api/campaigns", (_req, res) => res.json([]));
  app2.get("/api/accounts", (_req, res) => res.json([]));
  app2.get("/api/accounts/with-status", (_req, res) => res.json([]));
  app2.get(
    "/api/activity",
    (_req, res) => res.json({ logs: [], total: 0, hasMore: false })
  );
  app2.get(
    "/api/queue/status",
    (_req, res) => res.json({ pending: 0, processing: 0, pendingItems: 0 })
  );
  app2.get("/api/oauth-calendar/accounts", (_req, res) => res.json([]));
  app2.get("/api/microsoft/accounts", (_req, res) => res.json([]));
  app2.get("/api/settings", (_req, res) => res.json({}));
  app2.get(
    "/api/auth/service-account/status",
    (_req, res) => res.json({ configured: false, available: false })
  );
  app2.post("/api/login", (req, res) => {
    req.session.userId = mockUser.id;
    res.json(mockUser);
  });
  app2.post("/api/signup", (req, res) => {
    req.session.userId = mockUser.id;
    res.json(mockUser);
  });
  app2.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });
  app2.use("/api", (_req, res) => {
    res.json([]);
  });
  return createServer(app2);
}

// server/vercel-handler.ts
var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
var MemoryStore = createMemoryStore(session);
app.use(
  session({
    secret: process.env.SESSION_SECRET || "shady-5-session-secret-key",
    store: new MemoryStore({ checkPeriod: 864e5 }),
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1e3,
      httpOnly: true
    }
  })
);
var ready = false;
function ensureReady() {
  if (!ready) {
    if (process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is set but full server routes are not bundled for Vercel yet.");
    }
    registerPreviewRoutes(app);
    ready = true;
  }
}
async function handler(req, res) {
  ensureReady();
  return app(req, res);
}
export {
  handler as default
};
