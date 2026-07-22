import { Router } from "express";
import { pool } from "@workspace/db";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM companies WHERE id = $1 LIMIT 1",
    [req.session.companyId],
  );
  res.json(rows[0] ?? {});
});

// ── GET /api/company/users (admins only) ─────────────────────
router.get("/users", requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    "SELECT id, name, email, role FROM app_users WHERE company_id = $1 ORDER BY name",
    [req.session.companyId],
  );
  res.json(rows);
});

router.put("/", requireAuth, async (req, res) => {
  const { name, suffix, mark, accent } = req.body as Record<string, string>;
  const { rows } = await pool.query(
    "UPDATE companies SET name = $1, suffix = $2, mark = $3, accent = $4 WHERE id = $5 RETURNING *",
    [name, suffix, mark, accent, req.session.companyId],
  );
  res.json(rows[0] ?? {});
});

export default router;
