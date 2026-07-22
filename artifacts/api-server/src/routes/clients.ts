/**
 * Clients + Vehicles — returns clients with vehicles embedded.
 */
import { Router } from "express";
import { pool } from "@workspace/db";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

async function fetchClientsWithVehicles(companyId: string) {
  const [{ rows: clientRows }, { rows: vehicleRows }] = await Promise.all([
    pool.query(
      "SELECT * FROM clients WHERE company_id = $1 ORDER BY created_at DESC",
      [companyId],
    ),
    pool.query(
      "SELECT * FROM vehicles WHERE company_id = $1",
      [companyId],
    ),
  ]);
  return clientRows.map((c) => ({
    ...c,
    vehicles: vehicleRows.filter((v) => v.client_id === c.id),
  }));
}

// ── GET /api/clients ─────────────────────────────────────────
router.get("/", requireAuth, async (req, res) => {
  try {
    const data = await fetchClientsWithVehicles(req.session.companyId!);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Erro ao buscar clientes" });
  }
});

// ── POST /api/clients ────────────────────────────────────────
router.post("/", requireAuth, async (req, res) => {
  try {
    const { vehicles = [], ...clientFields } = req.body as Record<string, unknown> & { vehicles?: Record<string, unknown>[] };
    const { id: _id, company_id: _cid, ...cf } = clientFields;

    const keys        = Object.keys(cf);
    const vals        = Object.values(cf);
    const cols        = ["company_id", ...keys].join(", ");
    const placeholders = ["$1", ...keys.map((_, i) => `$${i + 2}`)].join(", ");

    const { rows } = await pool.query(
      `INSERT INTO clients (${cols}) VALUES (${placeholders}) RETURNING *`,
      [req.session.companyId, ...vals],
    );
    const client = rows[0] as { id: string };

    // Insert vehicles
    const insertedVehicles = await Promise.all(
      (vehicles as Record<string, unknown>[]).map(async (v) => {
        const { id: _vid, client_id: _cid2, company_id: _vcid, ...vf } = v;
        const vkeys = Object.keys(vf);
        const vvals = Object.values(vf);
        const vcols = ["client_id", "company_id", ...vkeys].join(", ");
        const vph   = ["$1", "$2", ...vkeys.map((_, i) => `$${i + 3}`)].join(", ");
        const { rows: vrows } = await pool.query(
          `INSERT INTO vehicles (${vcols}) VALUES (${vph}) RETURNING *`,
          [client.id, req.session.companyId, ...vvals],
        );
        return vrows[0];
      }),
    );

    res.status(201).json({ ...client, vehicles: insertedVehicles });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Erro ao salvar cliente" });
  }
});

// ── PUT /api/clients/:id ─────────────────────────────────────
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { vehicles = [], ...clientFields } = req.body as Record<string, unknown> & { vehicles?: Record<string, unknown>[] };
    const { id: _id, company_id: _cid, ...cf } = clientFields;

    const keys      = Object.keys(cf);
    const vals      = Object.values(cf);
    const setClause = keys.map((k, i) => `${k} = $${i + 3}`).join(", ");

    if (keys.length > 0) {
      await pool.query(
        `UPDATE clients SET ${setClause} WHERE id = $1 AND company_id = $2`,
        [id, req.session.companyId, ...vals],
      );
    }

    // Sync vehicles: get existing, diff, insert/update/delete
    const { rows: existingVehicles } = await pool.query(
      "SELECT id FROM vehicles WHERE client_id = $1",
      [id],
    );
    const existingIds = new Set(existingVehicles.map((v) => v.id as string));
    const nextIds     = new Set((vehicles as { id?: string }[]).map((v) => v.id).filter(Boolean));

    // Delete removed
    const toDelete = [...existingIds].filter((vid) => !nextIds.has(vid));
    await Promise.all(toDelete.map((vid) => pool.query("DELETE FROM vehicles WHERE id = $1", [vid])));

    // Insert/update
    await Promise.all(
      (vehicles as Record<string, unknown>[]).map(async (v) => {
        const { id: vid, client_id: _cid2, company_id: _vcid, ...vf } = v;
        const vkeys = Object.keys(vf);
        const vvals = Object.values(vf);

        if (vid && existingIds.has(vid as string)) {
          // update
          const setV = vkeys.map((k, i) => `${k} = $${i + 2}`).join(", ");
          if (vkeys.length > 0) {
            await pool.query(`UPDATE vehicles SET ${setV} WHERE id = $1`, [vid, ...vvals]);
          }
        } else {
          // insert
          const vcols = ["client_id", "company_id", ...vkeys].join(", ");
          const vph   = ["$1", "$2", ...vkeys.map((_, i) => `$${i + 3}`)].join(", ");
          await pool.query(
            `INSERT INTO vehicles (${vcols}) VALUES (${vph})`,
            [id, req.session.companyId, ...vvals],
          );
        }
      }),
    );

    const updated = await fetchClientsWithVehicles(req.session.companyId!);
    const client  = updated.find((c) => c.id === id);
    res.json(client ?? { id });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Erro ao atualizar cliente" });
  }
});

// ── DELETE /api/clients/:id ──────────────────────────────────
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM clients WHERE id = $1 AND company_id = $2",
      [req.params.id, req.session.companyId],
    );
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Erro ao excluir cliente" });
  }
});

export default router;
