// server/vercel-handler.ts
import "dotenv/config";
import express from "express";

// server/demo-session.ts
import cookieSession from "cookie-session";
function configureDemoSession(app2) {
  app2.use(
    cookieSession({
      name: "shady-demo-session",
      keys: [process.env.SESSION_SECRET || "shady-5-session-secret-key"],
      maxAge: 7 * 24 * 60 * 60 * 1e3,
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      path: "/"
    })
  );
}
function setSessionUser(req, user) {
  req.session = {
    userId: user.id,
    email: user.email,
    createdAt: user.createdAt
  };
}
function clearDemoSession(req) {
  req.session = null;
}
function getSessionUser(req) {
  if (!req.session?.userId || !req.session.email) {
    return null;
  }
  return {
    id: req.session.userId,
    email: req.session.email,
    createdAt: req.session.createdAt || (/* @__PURE__ */ new Date()).toISOString()
  };
}

// server/preview-routes.ts
import { createServer } from "http";

// server/demo-auth.ts
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
var DEMO_CREDENTIALS = {
  email: "demo@shady.app",
  password: "demo123"
};
var usersById = /* @__PURE__ */ new Map();
var usersByEmail = /* @__PURE__ */ new Map();
var seeded = false;
async function seedDemoUser() {
  if (seeded) return;
  const passwordHash = await bcrypt.hash(DEMO_CREDENTIALS.password, 10);
  const demoUser = {
    id: "demo-user-001",
    email: DEMO_CREDENTIALS.email,
    passwordHash,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  usersById.set(demoUser.id, demoUser);
  usersByEmail.set(demoUser.email, demoUser);
  seeded = true;
}
async function ensureDemoUsers() {
  await seedDemoUser();
}
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validatePassword(password) {
  if (password.length < 6) {
    return { valid: false, message: "Password must be at least 6 characters long" };
  }
  return { valid: true };
}
async function createDemoUser(email, password) {
  await ensureDemoUsers();
  const normalizedEmail = email.toLowerCase();
  if (usersByEmail.has(normalizedEmail)) {
    throw new Error("USER_EXISTS");
  }
  const user = {
    id: randomUUID(),
    email: normalizedEmail,
    passwordHash: await bcrypt.hash(password, 10),
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  usersById.set(user.id, user);
  usersByEmail.set(user.email, user);
  return user;
}
async function authenticateDemoUser(email, password) {
  await ensureDemoUsers();
  const user = usersByEmail.get(email.toLowerCase());
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  return valid ? user : null;
}
function toPublicUser(user) {
  return { id: user.id, email: user.email, createdAt: user.createdAt };
}

// server/preview-routes.ts
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
  app2.get("/api/me", (req, res) => {
    const user = getSessionUser(req);
    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    res.json(user);
  });
  app2.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      const user = await authenticateDemoUser(email, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const publicUser = toPublicUser(user);
      setSessionUser(req, publicUser);
      res.json({
        message: "Login successful",
        user: publicUser
      });
    } catch (error) {
      console.error("Demo login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });
  app2.post("/api/signup", async (req, res) => {
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
      const publicUser = toPublicUser(user);
      setSessionUser(req, publicUser);
      res.status(201).json({
        message: "Account created successfully",
        user: publicUser
      });
    } catch (error) {
      if (error instanceof Error && error.message === "USER_EXISTS") {
        return res.status(409).json({ message: "User already exists with this email" });
      }
      console.error("Demo signup error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });
  app2.post("/api/logout", (req, res) => {
    clearDemoSession(req);
    res.json({ success: true });
  });
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
  app2.use("/api", (_req, res) => {
    res.json([]);
  });
  void ensureDemoUsers();
  return createServer(app2);
}

// server/vercel-handler.ts
var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
configureDemoSession(app);
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
