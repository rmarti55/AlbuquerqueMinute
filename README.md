# The Albuquerque Minute

Admin-only newsroom pipeline for Albuquerque civic meetings.

**Ships today:** Legistar ingest, Granicus video linkage, local STT (Deepgram), transcript copy UI at `/admin`.

**Not built:** `/admin/generate` article drafts (Civic Phase 3 — see [docs/abq-sources.md](docs/abq-sources.md)).

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

**Optional (local STT):** install `ffmpeg`, set `DEEPGRAM_API_KEY` in `.env.local`, then see [docs/abq-sources.md](docs/abq-sources.md#civic-phase-2--local-transcription-cli).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local dev server |
| `npm run db:push` | Push schema to Neon (runs SFM guard first) |
| `npm run db:init -- --apply` | Fresh ABQ database only — DROP + recreate tables |
| `npm run sync:legistar` | Manual Legistar sync (CLI) |
| `npm run stt:transcribe` | Local Granicus → Deepgram → DB (see abq-sources) |
| `npm run stt:smoke` | Cheap STT debug slice (ffmpeg + Deepgram) |
| `npm run sync:catskill-crew` | Refresh Catskill Crew research corpus |

## Database (Neon)

**Use a dedicated Neon project for ABQ only** (`ep-blue-sky-*` / `empty-poetry`). Never point `DATABASE_URL` at Santa Fe Minutes (`ep-ancient-cell-*`) — ABQ `scripts/init-db.ts` drops `meeting_videos` and will clobber SFM transcript data.

`init-db.ts` requires `--apply` and refuses SFM hosts/schemas. `db:push` and the live app use the same guard via `assert-not-sfm-db.ts`.

**Required reading before any DB command:**

- [docs/database-safety.md](docs/database-safety.md) — rules, allowed/forbidden commands, host check
- [docs/sep-2026-sfm-db-clobber.md](docs/sep-2026-sfm-db-clobber.md) — Sep 2026 incident report (why this matters)

## Deploy (Vercel)

1. Create Neon project and set `DATABASE_URL`
2. Create Clerk app; set publishable + secret keys
3. Set `ADMIN_EMAIL`, `CRON_SECRET`
4. Deploy — cron runs every 6h per `vercel.json`

See [docs/abq-sources.md](docs/abq-sources.md) for API details and source notes.
