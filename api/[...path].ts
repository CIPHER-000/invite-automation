import "dotenv/config";
import express from "express";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initApp } from "../server/create-server";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

let initPromise: Promise<void> | null = null;

function ensureReady() {
  if (!initPromise) {
    initPromise = initApp(app, { apiOnly: true });
  }
  return initPromise;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureReady();
  return app(req, res);
}
