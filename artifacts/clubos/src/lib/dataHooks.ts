import { useState, useEffect, useRef, useCallback } from "react";

/* ── fetch helpers ─────────────────────────────────────────────────────────
   cache: "no-store" prevents the browser from serving a stale 304 response
   that doesn't yet contain the item just saved.
   ───────────────────────────────────────────────────────────────────────── */
const BASE = "/api";
const JSON_H = { "Content-Type": "application/json" };

const apiGet  = (url: string) =>
  fetch(`${BASE}${url}`, { credentials: "include", cache: "no-store" });

const apiPost = (url: string, body: unknown) =>
  fetch(`${BASE}${url}`, { method: "POST", credentials: "include", headers: JSON_H, body: JSON.stringify(body) });

const apiPut  = (url: string, body: unknown) =>
  fetch(`${BASE}${url}`, { method: "PUT",  credentials: "include", headers: JSON_H, body: JSON.stringify(body) });

const apiDel  = (url: string) =>
  fetch(`${BASE}${url}`, { method: "DELETE", credentials: "include" });

function showError(msg: string) {
  window.dispatchEvent(new CustomEvent("clubos:dberror", { detail: { message: msg } }));
}

/* ==========================================================================
   useApiCollection

   Design: load once on mount → optimistic UI on save → sync to DB →
   always reload from DB afterwards so temp UUIDs become real DB UUIDs.

   No background polling: eliminates the race condition where a concurrent
   fetch would overwrite optimistic state before the POST commits to the DB.
   ========================================================================= */
export function useApiCollection(
  table: string,
  mapToJs: (row: Record<string, unknown>) => Record<string, unknown>,
  mapToDb: (item: Record<string, unknown>) => Record<string, unknown>,
  _orderBy = "created_at",
) {
  const [data,  setData]  = useState<Record<string, unknown>[]>([]);
  const [ready, setReady] = useState(false);
  const ref = useRef<Record<string, unknown>[]>([]); // current data ref (never stale)

  /* load: GET all rows, map, update state */
  async function load() {
    try {
      const res = await apiGet(`/table/${table}`);
      if (res.ok) {
        const rows = ((await res.json()) as Record<string, unknown>[]).map(mapToJs);
        ref.current = rows;
        setData(rows);
      }
    } catch { /* keep stale on network error */ }
    setReady(true);
  }

  // Load once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [table]);

  /* setSynced: optimistic update → diff → API calls → reload */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setSynced = useCallback(async (
    updater: Record<string, unknown>[] | ((prev: Record<string, unknown>[]) => Record<string, unknown>[]),
  ) => {
    const prev = ref.current;
    const next = typeof updater === "function" ? updater(prev) : updater;

    // 1. Show change immediately (optimistic)
    ref.current = next;
    setData(next);

    const prevIds = new Set(prev.map((x) => x.id));
    const nextIds = new Set(next.map((x) => x.id));

    // 2. Delete removed items
    for (const x of prev.filter((x) => !nextIds.has(x.id))) {
      try { await apiDel(`/table/${table}/${x.id}`); } catch { /* ignore */ }
    }

    // 3. Insert / update changed items
    for (const item of next) {
      const isNew    = !prevIds.has(item.id);
      const prevItem = prev.find((p) => p.id === item.id);
      if (!isNew && JSON.stringify(prevItem) === JSON.stringify(item)) continue;

      const row = mapToDb(item);
      try {
        if (isNew) {
          const res = await apiPost(`/table/${table}`, row);
          if (!res.ok) showError(`Erro ao salvar: ${await res.text().catch(() => res.status)}`);
        } else {
          const res = await apiPut(`/table/${table}/${item.id}`, row);
          if (!res.ok) showError("Erro ao atualizar. Tente novamente.");
        }
      } catch {
        showError("Erro de rede. Verifique sua conexão.");
      }
    }

    // 4. Reload from DB — replaces temp UUIDs with real ones, reverts on error
    await load();
  }, [table]); // table is constant per hook instance; load/mapToDb captured via closure

  return [data, setSynced, ready] as const;
}

/* ==========================================================================
   useClientsWithVehicles — same pattern, different endpoint & mapper
   ========================================================================= */
export function useClientsWithVehicles() {
  const [clients, setClients] = useState<Record<string, unknown>[]>([]);
  const [ready,   setReady]   = useState(false);
  const ref = useRef<Record<string, unknown>[]>([]);

  function mapClient(c: Record<string, unknown>) {
    return {
      id: c.id, name: c.name, doc: c.doc ?? "", phone: c.phone ?? "",
      whats: c.whats ?? true, address: c.address ?? "", notes: c.notes ?? "",
      lastVisit: c.last_visit,
      vehicles: ((c.vehicles ?? []) as Record<string, unknown>[]).map((v) => ({
        id: v.id, brand: v.brand ?? "", model: v.model ?? "", year: v.year ?? "",
        color: v.color ?? "", plate: v.plate ?? "", km: v.km ?? 0, notes: v.notes ?? "",
      })),
    };
  }

  async function load() {
    try {
      const res = await apiGet("/clients");
      if (res.ok) {
        const rows = ((await res.json()) as Record<string, unknown>[]).map(mapClient);
        ref.current = rows;
        setClients(rows);
      }
    } catch { /* keep stale */ }
    setReady(true);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setSynced = useCallback(async (
    updater: Record<string, unknown>[] | ((prev: Record<string, unknown>[]) => Record<string, unknown>[]),
  ) => {
    const prev = ref.current;
    const next = typeof updater === "function" ? updater(prev) : updater;

    // 1. Optimistic update
    ref.current = next;
    setClients(next);

    const prevIds = new Set(prev.map((c) => c.id));
    const nextIds = new Set(next.map((c) => c.id));

    // 2. Delete removed clients
    for (const c of prev.filter((c) => !nextIds.has(c.id))) {
      try { await apiDel(`/clients/${c.id}`); } catch { /* ignore */ }
    }

    // 3. Insert / update changed clients
    for (const client of next) {
      const isNew     = !prevIds.has(client.id);
      const prevClient = prev.find((p) => p.id === client.id);
      if (!isNew && JSON.stringify(prevClient) === JSON.stringify(client)) continue;

      const payload = {
        name: client.name, doc: client.doc, phone: client.phone, whats: client.whats,
        address: client.address, notes: client.notes, last_visit: client.lastVisit,
        vehicles: ((client.vehicles ?? []) as Record<string, unknown>[]).map((v) => ({
          id: v.id, brand: v.brand, model: v.model, year: v.year,
          color: v.color, plate: v.plate, km: v.km, notes: v.notes,
        })),
      };

      try {
        if (isNew) {
          const res = await apiPost("/clients", payload);
          if (!res.ok) showError(`Erro ao salvar cliente: ${await res.text().catch(() => res.status)}`);
        } else {
          const res = await apiPut(`/clients/${client.id}`, payload);
          if (!res.ok) showError("Erro ao atualizar cliente.");
        }
      } catch {
        showError("Erro de rede ao salvar cliente.");
      }
    }

    // 4. Reload from DB
    await load();
  }, []); // all deps stable (ref, load, mapClient are closure-captured)

  return [clients, setSynced, ready] as const;
}

/* ==========================================================================
   Mappers
   ========================================================================= */
export const ordersMap = {
  toJs: (o: Record<string, unknown>) => ({
    id: o.id, code: o.code, clientId: o.client_id, clientName: o.client_name,
    vehicleLabel: o.vehicle_label, serviceName: o.service_name,
    value: Number(o.value), discount: Number(o.discount),
    tech: o.tech ?? "", notes: o.notes ?? "", status: o.status, createdAt: o.created_at,
  }),
  // client_id must be null (not "") — PostgreSQL uuid columns reject empty string
  toDb: (o: Record<string, unknown>) => ({
    code: o.code, client_id: (o.clientId as string) || null, client_name: o.clientName,
    vehicle_label: o.vehicleLabel, service_name: o.serviceName,
    value: o.value, discount: o.discount, tech: o.tech, notes: o.notes,
    status: o.status, created_at: o.createdAt,
  }),
};

export const appointmentsMap = {
  toJs: (a: Record<string, unknown>) => ({
    id: a.id, clientId: a.client_id ?? "", clientName: a.client_name, service: a.service,
    price:    a.price    != null ? Number(a.price)    : undefined,
    discount: a.discount != null ? Number(a.discount) : undefined,
    time: a.time, date: a.date, status: a.status,
  }),
  // client_id must be null (not "") — PostgreSQL uuid columns reject empty string
  toDb: (a: Record<string, unknown>) => ({
    client_id: (a.clientId as string) || null, client_name: a.clientName, service: a.service,
    price: a.price ?? null, discount: a.discount ?? null,
    time: a.time, date: a.date, status: a.status,
  }),
};

export const servicesMap = {
  toJs: (s: Record<string, unknown>) => ({
    id: s.id, name: s.name, description: s.description ?? "",
    time: s.time_estimate ?? "", price: Number(s.price), commission: Number(s.commission),
  }),
  toDb: (s: Record<string, unknown>) => ({
    name: s.name, description: s.description ?? "", time_estimate: s.time,
    price: s.price, commission: s.commission,
  }),
};

export const productsMap = {
  toJs: (p: Record<string, unknown>) => ({
    id: p.id, name: p.name, qty: p.qty, min: p.min_qty,
    unitCost: Number(p.unit_cost), supplier: p.supplier ?? "",
  }),
  toDb: (p: Record<string, unknown>) => ({
    name: p.name, qty: p.qty, min_qty: p.min, unit_cost: p.unitCost, supplier: p.supplier,
  }),
};

export const employeesMap = {
  toJs: (e: Record<string, unknown>) => ({
    id: e.id, name: e.name, role: e.role ?? "", commission: Number(e.commission), goal: e.goal,
  }),
  toDb: (e: Record<string, unknown>) => ({
    name: e.name, role: e.role, commission: e.commission, goal: e.goal,
  }),
};

export const financialMap = {
  toJs: (f: Record<string, unknown>) => ({
    id: f.id, type: f.type, kind: f.kind, desc: f.description,
    value: Number(f.value), date: f.date, paid: f.paid,
  }),
  toDb: (f: Record<string, unknown>) => ({
    type: f.type, kind: f.kind, description: f.desc, value: f.value, date: f.date, paid: f.paid,
  }),
};
