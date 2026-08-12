import "dotenv/config";
import express from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { registerPreviewRoutes } from "./preview-routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const MemoryStore = createMemoryStore(session);
app.use(
  session({
    secret: process.env.SESSION_SECRET || "shady-5-session-secret-key",
    store: new MemoryStore({ checkPeriod: 86400000 }),
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    },
  }),
);

let ready = false;

function ensureReady() {
  if (!ready) {
    if (process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is set but full server routes are not bundled for Vercel yet.");
    }
    registerPreviewRoutes(app);
    ready = true;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  ensureReady();
  return app(req, res);
}
