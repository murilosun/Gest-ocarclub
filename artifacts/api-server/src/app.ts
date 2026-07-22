import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "@workspace/db";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const app: Express = express();

// ── Logging ──────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) { return { id: req.id, method: req.method, url: req.url?.split("?")[0] }; },
      res(res) { return { statusCode: res.statusCode }; },
    },
  }),
);

// ── CORS — allow credentials from same-origin proxy ──────────
app.use(cors({ origin: true, credentials: true }));

// ── Body parsers ─────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Sessions ─────────────────────────────────────────────────
const PgStore = connectPgSimple(session);

app.use(
  session({
    store: new PgStore({ pool, tableName: "session", createTableIfMissing: false }),
    secret: process.env["SESSION_SECRET"] ?? "clubos-dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // proxy handles TLS; keep false so cookie works in dev
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: "lax",
    },
  }),
);

// ── Routes ───────────────────────────────────────────────────
app.use("/api", router);

export default app;
