import type { Express } from "express";
import { createServer, type Server } from "http";

const mockUser = {
  id: "preview-user",
  email: "preview@example.com",
  createdAt: new Date().toISOString(),
};

const emptyStats = {
  activeCampaigns: 0,
  invitesToday: 0,
  dailyLimit: 100,
  acceptedInvites: 0,
  acceptanceRate: 0,
  connectedAccounts: 0,
  apiUsage: 12,
};

export function registerPreviewRoutes(app: Express): Server {
  app.get("/api/me", (_req, res) => res.json(mockUser));
  app.get("/api/dashboard/stats", (_req, res) => res.json(emptyStats));
  app.get("/api/campaigns", (_req, res) => res.json([]));
  app.get("/api/accounts", (_req, res) => res.json([]));
  app.get("/api/accounts/with-status", (_req, res) => res.json([]));
  app.get("/api/activity", (_req, res) =>
    res.json({ logs: [], total: 0, hasMore: false }),
  );
  app.get("/api/queue/status", (_req, res) =>
    res.json({ pending: 0, processing: 0, pendingItems: 0 }),
  );
  app.get("/api/oauth-calendar/accounts", (_req, res) => res.json([]));
  app.get("/api/microsoft/accounts", (_req, res) => res.json([]));
  app.get("/api/settings", (_req, res) => res.json({}));
  app.get("/api/auth/service-account/status", (_req, res) =>
    res.json({ configured: false, available: false }),
  );
  app.post("/api/login", (req, res) => {
    req.session.userId = mockUser.id;
    res.json(mockUser);
  });
  app.post("/api/signup", (req, res) => {
    req.session.userId = mockUser.id;
    res.json(mockUser);
  });
  app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.use("/api", (_req, res) => {
    res.json([]);
  });

  return createServer(app);
}
