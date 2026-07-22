import { pgTable, text, uuid, numeric, boolean, timestamp, integer } from "drizzle-orm/pg-core";

// ── companies ────────────────────────────────────────────────
export const companies = pgTable("companies", {
  id:     uuid("id").primaryKey().defaultRandom(),
  name:   text("name").notNull().default("ClubOS"),
  suffix: text("suffix").notNull().default("by Car Club"),
  mark:   text("mark").notNull().default("C"),
  accent: text("accent").notNull().default("#FF6A00"),
});

// ── app_users ────────────────────────────────────────────────
export const appUsers = pgTable("app_users", {
  id:           uuid("id").primaryKey().defaultRandom(),
  companyId:    uuid("company_id").notNull().references(() => companies.id),
  email:        text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name:         text("name").notNull(),
  role:         text("role").notNull().default("Colaborador"),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
});

// ── clients ──────────────────────────────────────────────────
export const clients = pgTable("clients", {
  id:        uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  name:      text("name").notNull(),
  doc:       text("doc").default(""),
  phone:     text("phone").default(""),
  whats:     boolean("whats").default(true),
  address:   text("address").default(""),
  notes:     text("notes").default(""),
  lastVisit: text("last_visit"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── vehicles ─────────────────────────────────────────────────
export const vehicles = pgTable("vehicles", {
  id:        uuid("id").primaryKey().defaultRandom(),
  clientId:  uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  brand:     text("brand").default(""),
  model:     text("model").default(""),
  year:      text("year").default(""),
  color:     text("color").default(""),
  plate:     text("plate").default(""),
  km:        integer("km").default(0),
  notes:     text("notes").default(""),
});

// ── services ─────────────────────────────────────────────────
export const services = pgTable("services", {
  id:           uuid("id").primaryKey().defaultRandom(),
  companyId:    uuid("company_id").notNull().references(() => companies.id),
  name:         text("name").notNull(),
  description:  text("description").default(""),
  timeEstimate: text("time_estimate").default(""),
  price:        numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
  commission:   numeric("commission", { precision: 5, scale: 2 }).notNull().default("0"),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
});

// ── employees ────────────────────────────────────────────────
export const employees = pgTable("employees", {
  id:         uuid("id").primaryKey().defaultRandom(),
  companyId:  uuid("company_id").notNull().references(() => companies.id),
  name:       text("name").notNull(),
  role:       text("role").default(""),
  commission: numeric("commission", { precision: 5, scale: 2 }).notNull().default("0"),
  goal:       numeric("goal", { precision: 10, scale: 2 }).default("0"),
  createdAt:  timestamp("created_at").notNull().defaultNow(),
});

// ── orders ───────────────────────────────────────────────────
export const orders = pgTable("orders", {
  id:           uuid("id").primaryKey().defaultRandom(),
  companyId:    uuid("company_id").notNull().references(() => companies.id),
  code:         text("code").notNull(),
  clientId:     uuid("client_id"),
  clientName:   text("client_name").notNull(),
  vehicleLabel: text("vehicle_label").default("Sem veículo"),
  serviceName:  text("service_name").notNull(),
  value:        numeric("value", { precision: 10, scale: 2 }).notNull().default("0"),
  discount:     numeric("discount", { precision: 5, scale: 2 }).notNull().default("0"),
  tech:         text("tech").default(""),
  notes:        text("notes").default(""),
  status:       text("status").notNull().default("Em espera"),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
});

// ── appointments ─────────────────────────────────────────────
export const appointments = pgTable("appointments", {
  id:         uuid("id").primaryKey().defaultRandom(),
  companyId:  uuid("company_id").notNull().references(() => companies.id),
  clientId:   uuid("client_id"),
  clientName: text("client_name").notNull(),
  service:    text("service").notNull(),
  price:      numeric("price", { precision: 10, scale: 2 }),
  discount:   numeric("discount", { precision: 5, scale: 2 }),
  time:       text("time").notNull(),
  date:       text("date").notNull(),
  status:     text("status").notNull().default("Agendado"),
});

// ── products ─────────────────────────────────────────────────
export const products = pgTable("products", {
  id:        uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  name:      text("name").notNull(),
  qty:       integer("qty").notNull().default(0),
  minQty:    integer("min_qty").notNull().default(0),
  unitCost:  numeric("unit_cost", { precision: 10, scale: 2 }).notNull().default("0"),
  supplier:  text("supplier").default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── financial ────────────────────────────────────────────────
export const financial = pgTable("financial", {
  id:          uuid("id").primaryKey().defaultRandom(),
  companyId:   uuid("company_id").notNull().references(() => companies.id),
  type:        text("type").notNull(),
  kind:        text("kind").notNull(),
  description: text("description").notNull(),
  value:       numeric("value", { precision: 10, scale: 2 }).notNull(),
  date:        text("date").notNull(),
  paid:        boolean("paid").notNull().default(false),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
});

// ── sessions (connect-pg-simple) ─────────────────────────────
export const sessions = pgTable("session", {
  sid:    text("sid").primaryKey(),
  sess:   text("sess").notNull(),
  expire: timestamp("expire").notNull(),
});
