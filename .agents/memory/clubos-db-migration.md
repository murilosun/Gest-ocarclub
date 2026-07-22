---
name: ClubOS DB Migration
description: Supabase → Replit PostgreSQL + Express API migration details and architecture
---

# ClubOS: Supabase → Replit DB Migration

**Why:** Supabase schema mismatches caused silent data loss on save. Replit DB is fully controlled — no missing columns.

## Architecture After Migration

- **Database:** Replit built-in PostgreSQL via `@workspace/db` (Drizzle schema defined, raw SQL used in routes)
- **API:** Express at `/api` (artifacts/api-server) — session-based auth + CRUD
- **Frontend:** Vite React at `/` (artifacts/clubos) — no Supabase, all fetch via apiClient.ts

## Auth
- Session-based: `express-session` + `connect-pg-simple` (stores in `session` table)
- Passwords: `bcryptjs` (12 rounds)
- Cookie: httpOnly, sameSite=lax, 30-day maxAge
- `SESSION_SECRET` from Replit Secrets

## API Routes
- `POST /api/auth/login` — sets session cookie
- `POST /api/auth/register` — creates company + user
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET|POST /api/table/:t` — generic CRUD (allowed: orders, appointments, services, products, employees, financial)
- `PUT|DELETE /api/table/:t/:id`
- `GET|POST /api/clients` — clients with vehicles embedded
- `PUT|DELETE /api/clients/:id`
- `GET|PUT /api/company`
- `GET /api/company/users`

## Frontend Key Files
- `src/lib/apiClient.ts` — fetch wrapper (credentials: include)
- `src/lib/auth.ts` — useAuth hook via /api/auth/me
- `src/lib/dataHooks.ts` — useApiCollection (polls 10s) + useClientsWithVehicles + mappers
- `src/App.tsx` — AuthenticatedApp component (data hooks only mount AFTER login)
- `src/lib/supabaseClient.ts` — STUB, exports null; safe to ignore

## DB Tables
companies, app_users, session, clients, vehicles, services, employees, orders, appointments, products, financial

## Important: Registration creates a new company per user
Each `POST /api/auth/register` creates a fresh company row + links the user to it. Multi-user companies must register first user, then add others via a future "invite" flow.

## How to apply
Any new data feature: add column to schema, run executeSql to ALTER TABLE, update mapper in dataHooks.ts and route in table.ts or clients.ts.
