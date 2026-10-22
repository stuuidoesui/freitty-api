# Deploy

Two GitHub repos → Render (API + Postgres) + Vercel (SPA).

## 1. Push both repos

```bash
# backend
cd ~/Projects/freitty-backend
git init
git add .
git commit -m "Initial commit: Freitty client cabinet API"
gh repo create freitty-backend --private --source=. --remote=origin --push

# frontend
cd ~/Projects/freitty-frontend
git init
git add .
git commit -m "Initial commit: Freitty client cabinet UI"
gh repo create freitty-frontend --private --source=. --remote=origin --push
```

## 2. Render (backend)

1. https://dashboard.render.com → New → Blueprint
2. Connect `freitty-backend`
3. `render.yaml` creates `freitty-api` + `freitty-db`
4. Set `FRONTEND_ORIGIN` to the Vercel URL (can add after step 3)
5. Wait for first deploy. Wake the free instance via `GET /api/health` before a demo — it sleeps.

Swagger: `https://<service>.onrender.com/api/docs`

## 3. Vercel (frontend)

1. https://vercel.com/new → import `freitty-frontend`
2. Env: `VITE_API_URL=https://<service>.onrender.com` (no trailing slash)
3. Deploy
4. Copy the Vercel URL back into Render `FRONTEND_ORIGIN`

## Notes

- Free Render Postgres expires after 30 days.
- Seed runs on every boot (`prisma db seed`) so demo data resets — fine for the assignment, not for production.
