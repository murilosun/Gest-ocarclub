import { useState, useEffect, useRef, useCallback } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "./apiClient";

/* ==========================================================================
   useApiCollection
   Same interface as the old useSupabaseCollection — pages don't change.
   Fetches from /api/table/:table, polls every 10 s so both users stay in sync.
   ========================================================================= */
export function useApiCollection(
  table: string,
  mapToJs: (row: Record<string, unknown>) => Record<string, unknown>,
  mapToDb: (item: Record<string, unknown>) => Record<string, unknown>,
  _orderBy = "created_at",
) {
  const [data, setData]   = useState<Record<string, unknown>[]>([]);
  const [ready, setReady] = useState(false);
  const prevRef           = useRef<Record<string, unknown>[]>([]);

  const fetchAll = useCallback(async () => {
    try {
      const res = await apiGet(`/table/${table}`);
      if (res.ok) {
        const rows = (await res.json()) as Record<string, unknown>[];
        const mapped = rows.map(mapToJs);
        prevRef.current = mapped;
        setData(mapped);
      }
    } catch { /* network glitch — keep stale data */ }
    setReady(true);
  }, [table]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const setSynced = useCallback(
    async (updater: Record<string, unknown>[] | ((p: Record<string, unknown>[]) => Record<string, unknown>[])) => {
      const prev = prevRef.current;
      const next = typeof updater === "function" ? updater(prev) : updater;
      setData(next);
      prevRef.current = next;

      const prevIds = new Set(prev.map((x) => x.id));
      const nextIds = new Set(next.map((x) => x.id));

      // Delete removed items
      await Promise.all(
        prev.filter((x) => !nextIds.has(x.id)).map(async (x) => {
          try { await apiDelete(`/table/${table}/${x.id}`); } catch { /* ignore network errors on delete */ }
        }),
      );

      // Insert / update changed items
      for (const item of next) {
        const isNew    = !prevIds.has(item.id);
        const prevItem = prev.find((p) => p.id === item.id);
        const changed  = isNew || JSON.stringify(prevItem) !== JSON.stringify(item);
        if (!changed) continue;

        const row = mapToDb(item);

        try {
          if (isNew) {
            const res = await apiPost(`/table/${table}`, row);
            if (res.ok) {
              const created = (await res.json()) as Record<string, unknown>;
              const fresh   = mapToJs(created);
              setData((cur) => cur.map((x) => (x.id === item.id ? fresh : x)));
              prevRef.current = prevRef.current.map((x) => (x.id === item.id ? fresh : x));
            } else {
              const msg = await res.text().catch(() => `status ${res.status}`);
              window.dispatchEvent(new CustomEvent("clubos:dberror", { detail: { message: `Erro ao salvar: ${msg}` } }));
              fetchAll(); // revert optimistic update
            }
          } else {
            const res = await apiPut(`/table/${table}/${item.id}`, row);
            if (!res.ok) {
              window.dispatchEvent(new CustomEvent("clubos:dberror", { detail: { message: "Erro ao atualizar. Tente novamente." } }));
              fetchAll();
            }
          }
        } catch {
          window.dispatchEvent(new CustomEvent("clubos:dberror", { detail: { message: "Erro de rede ao salvar. Tente novamente." } }));
          fetchAll(); // revert on network error
        }
      }
    },
    [table, mapToDb, mapToJs, fetchAll],
  );

  return [data, setSynced, ready] as const;
}

/* ==========================================================================
   useClientsWithVehicles
   Fetches GET /api/clients which returns clients with vehicles embedded.
   ========================================================================= */
export function useClientsWithVehicles() {
  const [clients, setClients] = useState<Record<string, unknown>[]>([]);
  const [ready, setReady]     = useState(false);
  const prevRef               = useRef<Record<string, unknown>[]>([]);

  const mapClient = (c: Record<string, unknown>) => ({
    id: c.id, name: c.name, doc: c.doc ?? "", phone: c.phone ?? "",
    whats: c.whats ?? true, address: c.address ?? "", notes: c.notes ?? "",
    lastVisit: c.last_visit,
    vehicles: ((c.vehicles ?? []) as Record<string, unknown>[]).map((v) => ({
      id: v.id, brand: v.brand ?? "", model: v.model ?? "", year: v.year ?? "",
      color: v.color ?? "", plate: v.plate ?? "", km: v.km ?? 0, notes: v.notes ?? "",
    })),
  });

  const fetchAll = useCallback(async () => {
    try {
      const res = await apiGet("/clients");
      if (res.ok) {
        const rows = (await res.json()) as Record<string, unknown>[];
        const mapped = rows.map(mapClient);
        prevRef.current = mapped;
        setClients(mapped);
      }
    } catch { /* keep stale */ }
    setReady(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const setSynced = useCallback(
    async (updater: Record<string, unknown>[] | ((p: Record<string, unknown>[]) => Record<string, unknown>[])) => {
      const prev = prevRef.current;
      const next = typeof updater === "function" ? updater(prev) : updater;
      setClients(next);
      prevRef.current = next;

      const prevIds = new Set(prev.map((c) => c.id));
      const nextIds = new Set(next.map((c) => c.id));

      // Delete removed clients
      await Promise.all(
        prev.filter((c) => !nextIds.has(c.id)).map(async (c) => {
          try { await apiDelete(`/clients/${c.id}`); } catch { /* ignore */ }
        }),
      );

      for (const client of next) {
        const isNew      = !prevIds.has(client.id);
        const prevClient = prev.find((p) => p.id === client.id);
        const changed    = isNew || JSON.stringify(prevClient) !== JSON.stringify(client);
        if (!changed) continue;

        const payload = {
          name:      client.name,
          doc:       client.doc,
          phone:     client.phone,
          whats:     client.whats,
          address:   client.address,
          notes:     client.notes,
          last_visit: client.lastVisit,
          vehicles:  ((client.vehicles ?? []) as Record<string, unknown>[]).map((v) => ({
            id:    v.id,
            brand: v.brand, model: v.model, year: v.year,
            color: v.color, plate: v.plate, km: v.km, notes: v.notes,
          })),
        };

        try {
          if (isNew) {
            const res = await apiPost("/clients", payload);
            if (res.ok) {
              const created = (await res.json()) as Record<string, unknown>;
              const fresh   = mapClient(created);
              setClients((cur) => cur.map((x) => (x.id === client.id ? fresh : x)));
              prevRef.current = prevRef.current.map((x) => (x.id === client.id ? fresh : x));
            } else {
              const msg = await res.text().catch(() => `status ${res.status}`);
              window.dispatchEvent(new CustomEvent("clubos:dberror", { detail: { message: `Erro ao salvar cliente: ${msg}` } }));
              fetchAll();
            }
          } else {
            const res = await apiPut(`/clients/${client.id}`, payload);
            if (!res.ok) {
              window.dispatchEvent(new CustomEvent("clubos:dberror", { detail: { message: "Erro ao atualizar cliente." } }));
              fetchAll();
            }
          }
        } catch {
          window.dispatchEvent(new CustomEvent("clubos:dberror", { detail: { message: "Erro de rede ao salvar cliente." } }));
          fetchAll();
        }
      }
    },
    [fetchAll],
  );

  return [clients, setSynced, ready] as const;
}

/* ==========================================================================
   Mappers — same as before so pages don't change at all.
   ========================================================================= */
export const ordersMap = {
  toJs: (o: Record<string, unknown>) => ({ id: o.id, code: o.code, clientId: o.client_id, clientName: o.client_name, vehicleLabel: o.vehicle_label, serviceName: o.service_name, value: Number(o.value), discount: Number(o.discount), tech: o.tech ?? "", notes: o.notes ?? "", status: o.status, createdAt: o.created_at }),
  toDb: (o: Record<string, unknown>) => ({ code: o.code, client_id: o.clientId ?? null, client_name: o.clientName, vehicle_label: o.vehicleLabel, service_name: o.serviceName, value: o.value, discount: o.discount, tech: o.tech, notes: o.notes, status: o.status, created_at: o.createdAt }),
};
export const appointmentsMap = {
  toJs: (a: Record<string, unknown>) => ({ id: a.id, clientId: a.client_id ?? "", clientName: a.client_name, service: a.service, price: a.price != null ? Number(a.price) : undefined, discount: a.discount != null ? Number(a.discount) : undefined, time: a.time, date: a.date, status: a.status }),
  toDb: (a: Record<string, unknown>) => ({ client_id: a.clientId ?? null, client_name: a.clientName, service: a.service, price: a.price ?? null, discount: a.discount ?? null, time: a.time, date: a.date, status: a.status }),
};
export const servicesMap = {
  toJs: (s: Record<string, unknown>) => ({ id: s.id, name: s.name, description: s.description ?? "", time: s.time_estimate ?? "", price: Number(s.price), commission: Number(s.commission) }),
  toDb: (s: Record<string, unknown>) => ({ name: s.name, description: s.description ?? "", time_estimate: s.time, price: s.price, commission: s.commission }),
};
export const productsMap = {
  toJs: (p: Record<string, unknown>) => ({ id: p.id, name: p.name, qty: p.qty, min: p.min_qty, unitCost: Number(p.unit_cost), supplier: p.supplier ?? "" }),
  toDb: (p: Record<string, unknown>) => ({ name: p.name, qty: p.qty, min_qty: p.min, unit_cost: p.unitCost, supplier: p.supplier }),
};
export const employeesMap = {
  toJs: (e: Record<string, unknown>) => ({ id: e.id, name: e.name, role: e.role ?? "", commission: Number(e.commission), goal: e.goal }),
  toDb: (e: Record<string, unknown>) => ({ name: e.name, role: e.role, commission: e.commission, goal: e.goal }),
};
export const financialMap = {
  toJs: (f: Record<string, unknown>) => ({ id: f.id, type: f.type, kind: f.kind, desc: f.description, value: Number(f.value), date: f.date, paid: f.paid }),
  toDb: (f: Record<string, unknown>) => ({ type: f.type, kind: f.kind, description: f.desc, value: f.value, date: f.date, paid: f.paid }),
};
