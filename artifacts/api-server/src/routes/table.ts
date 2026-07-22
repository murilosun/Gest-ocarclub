/**
 * Generic CRUD router for all simple tables.
 * Routes: GET/POST /api/table/:t   PUT/DELETE /api/table/:t/:id
 */
import { Router } from "express";
import { pool } from "@workspace/db";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

// Tables that may be accessed via this generic router
const ALLOWED: Record<string, string> = {
  orders:       "created_at",
  appointments: "date",
  services:     "created_at",
  products:     "created_at",
  employees:    "created_at",
  financial:    "date",
};

function guard(t: string): t is keyof typeof ALLOWED {
  return t in ALLOWED;
}

// ── GET /api/table/:t ────────────────────────────────────────
router.get("/:t", requireAuth, async (req, res) => {
  const { t } = req.params;
  if (!guard(t)) { res.status(400).json({ error: "Tabela inválida" }); return; }

  const order = ALLOWED[t]!;
  const { rows } = await pool.query(
    `SELECT * FROM ${t} WHERE company_id = $1 ORDER BY ${order} DESC`,
    [req.session.companyId],
  );
  res.json(rows);
});

// ── POST /api/table/:t ───────────────────────────────────────
router.post("/:t", requireAuth, async (req, res) => {
  const { t } = req.params;
  if (!guard(t)) { res.status(400).json({ error: "Tabela inválida" }); return; }

  const body = req.body as Record<string, unknown>;
  // Remove id so DB generates it; attach company_id from session
  const { id: _id, company_id: _cid, ...fields } = body;
  const keys   = Object.keys(fields);
  const values = Object.values(fields);
  const cols   = ["company_id", ...keys].join(", ");
  const placeholders = ["$1", ...keys.map((_, i) => `$${i + 2}`)].join(", ");

  const { rows } = await pool.query(
    `INSERT INTO ${t} (${cols}) VALUES (${placeholders}) RETURNING *`,
    [req.session.companyId, ...values],
  );
  res.status(201).json(rows[0]);
});

// ── PUT /api/table/:t/:id ────────────────────────────────────
router.put("/:t/:id", requireAuth, async (req, res) => {
  const { t, id } = req.params;
  if (!guard(t)) { res.status(400).json({ error: "Tabela inválida" }); return; }

  const body = req.body as Record<string, unknown>;
  const { id: _id, company_id: _cid, ...fields } = body;
  const keys   = Object.keys(fields);
  const values = Object.values(fields);
  const setClause = keys.map((k, i) => `${k} = $${i + 3}`).join(", ");

  const { rows } = await pool.query(
    `UPDATE ${t} SET ${setClause} WHERE id = $1 AND company_id = $2 RETURNING *`,
    [id, req.session.companyId, ...values],
  );
  if (rows.length === 0) { res.status(404).json({ error: "Não encontrado" }); return; }
  res.json(rows[0]);
});

// ── DELETE /api/table/:t/:id ─────────────────────────────────
router.delete("/:t/:id", requireAuth, async (req, res) => {
  const { t, id } = req.params;
  if (!guard(t)) { res.status(400).json({ error: "Tabela inválida" }); return; }

  await pool.query(
    `DELETE FROM ${t} WHERE id = $1 AND company_id = $2`,
    [id, req.session.companyId],
  );
  res.json({ ok: true });
});

export default router;
