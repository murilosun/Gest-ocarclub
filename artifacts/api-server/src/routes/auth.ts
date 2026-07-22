import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "@workspace/db";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

// ── POST /api/auth/login ─────────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) { res.status(400).json({ error: "E-mail e senha obrigatórios" }); return; }

  const { rows } = await pool.query(
    "SELECT * FROM app_users WHERE email = $1 LIMIT 1",
    [email.toLowerCase().trim()],
  );
  const user = rows[0];
  if (!user) { res.status(401).json({ error: "E-mail ou senha inválidos" }); return; }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) { res.status(401).json({ error: "E-mail ou senha inválidos" }); return; }

  req.session.userId    = user.id;
  req.session.companyId = user.company_id;
  req.session.userName  = user.name;
  req.session.userRole  = user.role;
  req.session.userEmail = user.email;

  res.json({ id: user.id, name: user.name, role: user.role, email: user.email, companyId: user.company_id });
});

// ── POST /api/auth/register ──────────────────────────────────
router.post("/register", async (req, res) => {
  const { email, password, name, role } = req.body as { email?: string; password?: string; name?: string; role?: string };
  if (!email || !password || !name) { res.status(400).json({ error: "Campos obrigatórios faltando" }); return; }

  // Check duplicate
  const dup = await pool.query("SELECT id FROM app_users WHERE email = $1", [email.toLowerCase().trim()]);
  if (dup.rows.length > 0) { res.status(409).json({ error: "E-mail já cadastrado" }); return; }

  // Create or reuse a company (one per registration for now)
  const companyRes = await pool.query(
    "INSERT INTO companies DEFAULT VALUES RETURNING id",
  );
  const companyId = companyRes.rows[0].id as string;

  const hash = await bcrypt.hash(password, 12);
  const { rows } = await pool.query(
    "INSERT INTO app_users (company_id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [companyId, email.toLowerCase().trim(), hash, name, role ?? "Administrador"],
  );
  const user = rows[0];

  req.session.userId    = user.id;
  req.session.companyId = user.company_id;
  req.session.userName  = user.name;
  req.session.userRole  = user.role;
  req.session.userEmail = user.email;

  res.status(201).json({ id: user.id, name: user.name, role: user.role, email: user.email, companyId: user.company_id });
});

// ── POST /api/auth/logout ────────────────────────────────────
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

// ── GET /api/auth/me ─────────────────────────────────────────
router.get("/me", requireAuth, (req, res) => {
  res.json({
    id:        req.session.userId,
    companyId: req.session.companyId,
    name:      req.session.userName,
    role:      req.session.userRole,
    email:     req.session.userEmail,
  });
});

export default router;
