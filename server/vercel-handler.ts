import "dotenv/config";
import express from "express";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { configureDemoSession } from "./demo-session";
import { registerPreviewRoutes } from "./preview-routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
configureDemoSession(app);

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
