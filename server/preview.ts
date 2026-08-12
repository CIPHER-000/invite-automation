import "dotenv/config";
import express from "express";
import { createServerApp, log } from "./create-server";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const server = await createServerApp(app);

const PORT = Number(process.env.PORT ?? 5000);
server.listen(PORT, "0.0.0.0", () => {
  log(`UI preview mode — http://localhost:${PORT}`);
});
