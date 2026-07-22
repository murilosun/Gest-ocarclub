import { useState, useEffect, useRef, useCallback } from "react";
import { supabase, COMPANY_ID } from "./supabaseClient";

export function useSupabaseCollection<T extends { id: string }>(
  table: string,
  mapToJs: (row: any) => T,
  mapToDb: (item: T) => any,
  orderBy = "created_at"
) {
  const [data, setData] = useState<T[]>([]);
  const [ready, setReady] = useState(false);
  const prevRef = useRef<T[]>([]);

  const fetchAll = useCallback(async () => {
    const { data: rows, error } = await supabase
      .from(table)
      .select("*")
      .eq("company_id", COMPANY_ID)
      .order(orderBy, { ascending: false });
    if (!error && rows) {
      const mapped = rows.map(mapToJs);
      prevRef.current = mapped;
      setData(mapped);
    }
    setReady(true);
  }, [table, mapToJs, orderBy]);

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel(`rt-${table}-${COMPANY_ID}`)
      .on("postgres_changes", { event: "*", schema: "public", table, filter: `company_id=eq.${COMPANY_ID}` }, () => fetchAll())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAll, table]);

  const setSynced = useCallback(
    async (updater: T[] | ((prev: T[]) => T[])) => {
      const prev = prevRef.current;
      const next = typeof updater === "function" ? updater(prev) : updater;
      setData(next);
      prevRef.current = next;

      const prevIds = new Set(prev.map((x) => x.id));
      const nextIds = new Set(next.map((x) => x.id));

      const toDelete = prev.filter((x) => !nextIds.has(x.id));
      await Promise.all(toDelete.map((item) => supabase.from(table).delete().eq("id", item.id)));

      for (const item of next) {
        const isNew = !prevIds.has(item.id);
        const prevItem = prev.find((p) => p.id === item.id);
        const changed = isNew || JSON.stringify(prevItem) !== JSON.stringify(item);
        if (!changed) continue;
        const row = mapToDb(item);
        if (isNew) {
          const { id, ...rest } = row;
          const { data: inserted, error } = await supabase.from(table).insert({ ...rest, company_id: COMPANY_ID }).select().single();
          if (!error && inserted) {
            const fresh = mapToJs(inserted);
            setData((cur) => cur.map((x) => (x.id === item.id ? fresh : x)));
            prevRef.current = prevRef.current.map((x) => (x.id === item.id ? fresh : x));
          }
        } else {
          await supabase.from(table).update(row).eq("id", item.id);
        }
      }
    },
    [table, mapToDb, mapToJs]
  );

  return [data, setSynced, ready] as const;
}

export function useClientsWithVehicles() {
  const [clients, setClients] = useState<any[]>([]);
  const [ready, setReady] = useState(false);
  const prevRef = useRef<any[]>([]);

  const fetchAll = useCallback(async () => {
    const [{ data: clientRows }, { data: vehicleRows }] = await Promise.all([
      supabase.from("clients").select("*").eq("company_id", COMPANY_ID).order("created_at", { ascending: false }),
      supabase.from("vehicles").select("*").eq("company_id", COMPANY_ID),
    ]);
    const mapped = (clientRows || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      doc: c.doc || "",
      phone: c.phone || "",
      whats: c.whats,
      address: c.address || "",
      notes: c.notes || "",
      lastVisit: c.last_visit,
      vehicles: (vehicleRows || []).filter((v: any) => v.client_id === c.id).map((v: any) => ({
        id: v.id,
        brand: v.brand || "",
        model: v.model || "",
        year: v.year || "",
        color: v.color || "",
        plate: v.plate || "",
        km: v.km || 0,
        notes: v.notes || "",
      })),
    }));
    prevRef.current = mapped;
    setClients(mapped);
    setReady(true);
  }, []);

  useEffect(() => {
    fetchAll();
    const ch1 = supabase.channel(`rt-clients-${COMPANY_ID}`).on("postgres_changes", { event: "*", schema: "public", table: "clients", filter: `company_id=eq.${COMPANY_ID}` }, fetchAll).subscribe();
    const ch2 = supabase.channel(`rt-vehicles-${COMPANY_ID}`).on("postgres_changes", { event: "*", schema: "public", table: "vehicles", filter: `company_id=eq.${COMPANY_ID}` }, fetchAll).subscribe();
    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
    };
  }, [fetchAll]);

  const setSynced = useCallback(
    async (updater: any[] | ((prev: any[]) => any[])) => {
      const prev = prevRef.current;
      const next = typeof updater === "function" ? updater(prev) : updater;
      setClients(next);
      prevRef.current = next;

      const prevIds = new Set(prev.map((c) => c.id));
      const nextIds = new Set(next.map((c) => c.id));

      await Promise.all(prev.filter((c) => !nextIds.has(c.id)).map((c) => supabase.from("clients").delete().eq("id", c.id)));

      for (const client of next) {
        const isNewClient = !prevIds.has(client.id);
        const prevClient = prev.find((p) => p.id === client.id);
        const clientRow = {
          name: client.name,
          doc: client.doc,
          phone: client.phone,
          whats: client.whats,
          address: client.address,
          notes: client.notes,
          last_visit: client.lastVisit || null,
        };

        let realClientId = client.id;
        const clientChanged = isNewClient || JSON.stringify({ ...prevClient, vehicles: undefined }) !== JSON.stringify({ ...client, vehicles: undefined });

        if (isNewClient) {
          const { data: inserted, error } = await supabase.from("clients").insert({ ...clientRow, company_id: COMPANY_ID }).select().single();
          if (!error && inserted) realClientId = inserted.id;
        } else if (clientChanged) {
          await supabase.from("clients").update(clientRow).eq("id", client.id);
        }

        const prevVehicles = prevClient?.vehicles || [];
        const prevVIds = new Set(prevVehicles.map((v: any) => v.id));
        const nextVIds = new Set(client.vehicles.map((v: any) => v.id));
        await Promise.all(prevVehicles.filter((v: any) => !nextVIds.has(v.id)).map((v: any) => supabase.from("vehicles").delete().eq("id", v.id)));

        for (const v of client.vehicles) {
          const isNewV = !prevVIds.has(v.id);
          const prevV = prevVehicles.find((p: any) => p.id === v.id);
          const vChanged = isNewV || JSON.stringify(prevV) !== JSON.stringify(v);
          if (!vChanged) continue;
          const vRow = {
            brand: v.brand,
            model: v.model,
            year: v.year || null,
            color: v.color,
            plate: v.plate,
            km: v.km || 0,
            notes: v.notes,
          };
          if (isNewV) {
            await supabase.from("vehicles").insert({ ...vRow, client_id: realClientId, company_id: COMPANY_ID });
          } else {
            await supabase.from("vehicles").update(vRow).eq("id", v.id);
          }
        }
      }
      if (next.some((c, i) => !prevIds.has(c.id))) fetchAll();
    },
    [fetchAll]
  );

  return [clients, setSynced, ready] as const;
}

export const ordersMap = {
  toJs: (o: any) => ({
    id: o.id,
    code: o.code,
    clientId: o.client_id,
    clientName: o.client_name,
    vehicleLabel: o.vehicle_label,
    serviceName: o.service_name,
    value: Number(o.value),
    discount: Number(o.discount),
    tech: o.tech || "",
    notes: o.notes || "",
    status: o.status,
    createdAt: o.created_at,
  }),
  toDb: (o: any) => ({
    code: o.code,
    client_id: o.clientId || null,
    client_name: o.clientName,
    vehicle_label: o.vehicleLabel,
    service_name: o.serviceName,
    value: o.value,
    discount: o.discount,
    tech: o.tech,
    notes: o.notes,
    status: o.status,
    created_at: o.createdAt,
  }),
};

export const appointmentsMap = {
  toJs: (a: any) => ({
    id: a.id,
    clientName: a.client_name,
    service: a.service,
    time: a.time,
    date: a.date,
    status: a.status,
  }),
  toDb: (a: any) => ({
    client_name: a.clientName,
    service: a.service,
    time: a.time,
    date: a.date,
    status: a.status,
  }),
};

export const servicesMap = {
  toJs: (s: any) => ({
    id: s.id,
    name: s.name,
    time: s.time_estimate || "",
    price: Number(s.price),
    commission: Number(s.commission),
  }),
  toDb: (s: any) => ({
    name: s.name,
    time_estimate: s.time,
    price: s.price,
    commission: s.commission,
  }),
};

export const productsMap = {
  toJs: (p: any) => ({
    id: p.id,
    name: p.name,
    qty: p.qty,
    min: p.min_qty,
    unitCost: Number(p.unit_cost),
    supplier: p.supplier || "",
  }),
  toDb: (p: any) => ({
    name: p.name,
    qty: p.qty,
    min_qty: p.min,
    unit_cost: p.unitCost,
    supplier: p.supplier,
  }),
};

export const employeesMap = {
  toJs: (e: any) => ({
    id: e.id,
    name: e.name,
    role: e.role || "",
    commission: Number(e.commission),
    goal: e.goal,
  }),
  toDb: (e: any) => ({
    name: e.name,
    role: e.role,
    commission: e.commission,
    goal: e.goal,
  }),
};

export const financialMap = {
  toJs: (f: any) => ({
    id: f.id,
    type: f.type,
    kind: f.kind,
    desc: f.description,
    value: Number(f.value),
    date: f.date,
    paid: f.paid,
  }),
  toDb: (f: any) => ({
    type: f.type,
    kind: f.kind,
    description: f.desc,
    value: f.value,
    date: f.date,
    paid: f.paid,
  }),
};
