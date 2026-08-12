import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import {
  authenticateDemoUser,
  createDemoUser,
  ensureDemoUsers,
  getDemoUserById,
  toPublicUser,
  validateEmail,
  validatePassword,
} from "./demo-auth";

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
  app.get("/api/me", (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const user = getDemoUserById(req.session.userId);
    if (!user) {
      req.session.userId = undefined;
      return res.status(401).json({ message: "Authentication required" });
    }
    res.json(toPublicUser(user));
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await authenticateDemoUser(email, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      req.session.userId = user.id;
      res.json({
        message: "Login successful",
        user: toPublicUser(user),
      });
    } catch (error) {
      console.error("Demo login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/signup", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      if (!validateEmail(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ message: passwordValidation.message });
      }

      const user = await createDemoUser(email, password);
      req.session.userId = user.id;
      res.status(201).json({
        message: "Account created successfully",
        user: toPublicUser(user),
      });
    } catch (error) {
      if (error instanceof Error && error.message === "USER_EXISTS") {
        return res.status(409).json({ message: "User already exists with this email" });
      }
      console.error("Demo signup error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

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

  app.use("/api", (_req, res) => {
    res.json([]);
  });

  void ensureDemoUsers();
  return createServer(app);
}
