# The Albuquerque Minute

Admin-only newsroom pipeline for Albuquerque civic meetings — Legistar ingest, Granicus video, STT, and article generation (phased).

**Not** the public Santa Fe Minutes civic portal.

**ABQ consumer newsletter research:** [`data/abq-market/`](data/abq-market/) (competitive landscape, event sources) + [`data/catskill-crew/CADENCE-PLAYBOOK.md`](data/catskill-crew/CADENCE-PLAYBOOK.md) (Catskill format to copy).

## Stack

- Next.js 15 (App Router)
- Clerk auth (admin allowlist)
- Neon Postgres + Drizzle ORM
- Legistar `cabq` API · Granicus video

## Quick start

```bash
cp .env.example .env.local
# Fill DATABASE_URL, Clerk keys, CRON_SECRET

npm install
npm run db:push
npm run dev
```

Open [http://localhost:3000/admin](http://localhost:3000/admin) — sign in with the allowlisted email.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local dev server |
| `npm run db:push` | Push schema to Neon |
| `npm run sync:legistar` | Manual Legistar sync (CLI) |

## Deploy (Vercel)

1. Create Neon project and set `DATABASE_URL`
2. Create Clerk app; set publishable + secret keys
3. Set `ADMIN_EMAIL`, `CRON_SECRET`
4. Deploy — cron runs every 6h per `vercel.json`

See [docs/abq-sources.md](docs/abq-sources.md) for API details and source notes.
