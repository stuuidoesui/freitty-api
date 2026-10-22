# Freitty Backend

REST API for the Freitty client cabinet (test assignment). TypeScript, NestJS 11, Prisma, PostgreSQL.

## Architecture

```
Browser  →  React SPA (Vercel)
                │  REST /api
                ▼
         NestJS API (Render)
                │  Prisma
                ▼
         PostgreSQL (Render)
```

### Why this stack

- **NestJS** — modules, DI, ValidationPipe, Swagger out of the box. Easy to walk through on a presentation.
- **Prisma** — typed schema that maps 1:1 to the mockup (orders, sub-orders, operations, supplies, docks).
- **PostgreSQL** — required by the assignment; KPI / chart aggregations use `date_trunc` in SQL, not in JS.
- **OpenAPI / Swagger** at `/api/docs` — the frontend generates its client from this contract.

### Domain

A client company (`Account`) has users and orders. An order is either **Cross-Dock** or **Consolidation**. Consolidation has `SubOrder`s (client Ref N). Cross-Dock detail adds dock assignment, warehouse operations, and platform-sale supplies.

Pipeline columns: Draft → Ready → In Progress → Consolidated → In Transit → Deconsolidated → Closed.

**Business rule (from the mockup):** a client may only drag **Draft → Ready**. Any other transition returns `403`.

Seed data is dated around **17 Apr 2026** (the mockup week). `DEMO_NOW` freezes KPI windows so the dashboard is reproducible.

## API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/health` | Liveness + DB ping |
| GET | `/api/me` | Demo user U1 + balance |
| GET | `/api/dashboard/summary` | KPI cards |
| GET | `/api/dashboard/active-orders` | Active order cards |
| GET | `/api/dashboard/activity?period=` | Completed / spend series |
| GET | `/api/orders` | Filtered, paginated list |
| GET | `/api/orders/counts` | Tab counters |
| GET | `/api/orders/export.csv` | Same filters, CSV |
| GET | `/api/orders/:number` | Full detail |
| PATCH | `/api/orders/:number/status` | Pipeline move |

Interactive docs: `/api/docs`.

## Local setup

```bash
docker compose up -d          # Postgres on localhost:5434
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

API: http://localhost:3000/api  
Swagger: http://localhost:3000/api/docs

Frontend lives in a sibling repo: `~/Projects/freitty-frontend`.

Deploy: see [DEPLOY.md](./DEPLOY.md).

## Tests

```bash
npm test          # unit
npm run test:e2e  # needs a seeded database
```

## Deploy (Render)

Blueprint: [`render.yaml`](./render.yaml). Connect the GitHub repo, set `FRONTEND_ORIGIN` to the Vercel URL. Free web services sleep; wake `/api/health` before a demo. Free Postgres expires after 30 days.

## What I would add next

- Real auth (JWT / session) instead of the hardcoded U1 demo user
- Photo upload to object storage
- Websocket status updates from the warehouse
- Idempotent seed that does not wipe production on every deploy
