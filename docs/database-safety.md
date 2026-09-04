# Database safety — Albuquerque Minute

**Read this before running any command that touches Postgres.**

Albuquerque Minute and Santa Fe Minutes both have a table named `public.meeting_videos`. Same name, **different schema**. Pointing ABQ at Santa Fe’s Neon and running setup scripts **destroyed Santa Fe’s transcript pipeline for ~19 hours** in Sep 2026. See [sep-2026-sfm-db-clobber.md](sep-2026-sfm-db-clobber.md) for the full forensic report.

**Last updated:** September 2026

---

## Production databases (verified Sep 2026)

| App | Neon host pattern | Neon project |
|---|---|---|
| **Albuquerque Minute (this repo)** | `ep-blue-sky-*` | `empty-poetry-25203087` |
| **Santa Fe Minutes (never use here)** | `ep-ancient-cell-*` | `fancy-wildflower-24339791` |

Both default to a database named `neondb`. **Host pattern matters, not the db name.**

---

## Rules (non-negotiable)

1. **Own Neon only.** ABQ `DATABASE_URL` must be `ep-blue-sky-*` / project `empty-poetry-25203087`. **Never** `ep-ancient-cell-*` / `fancy-wildflower`.

2. **Never copy Santa Fe’s `.env.local`.** When bootstrapping ABQ, create a **new** Neon project in Vercel Storage. Do not paste SFM’s connection string “just to try it.”

3. **Same table name, different app.** `public.meeting_videos` in ABQ is **Legistar/Granicus** (`meeting_id`, `granicus_clip_id`). In SFM it is **CivicClerk/YouTube** (`event_id`, `youtube_video_id`). Same name does **not** mean shared table.

4. **Verify host before any DB command.** If unsure, stop.

   ```sh
   # ABQ repo — must print ep-blue-sky-*, must NOT print ancient-cell
   node -e "const u=new URL(process.env.DATABASE_URL.replace(/^postgres(ql)?:/,'http:')); console.log(u.hostname)"
   ```

5. **Agents and humans:** Do not run `db:push`, `db:init`, or `init-db.ts` unless you have verified the hostname above.

---

## Enforced guardrails (in this repo)

| Entry point | Guard |
|---|---|
| `npm run db:push` | Runs [`scripts/assert-not-sfm-db.ts`](../scripts/assert-not-sfm-db.ts) first |
| `npm run db:init` | [`scripts/init-db.ts`](../scripts/init-db.ts) requires `--apply`; refuses SFM host + SFM-shaped `meeting_videos` |
| App / CLI via `getDb()` | [`src/lib/db/assert-not-sfm.ts`](../src/lib/db/assert-not-sfm.ts) throws if URL looks like SFM |
| `drizzle.config.ts` | Same host check before `drizzle-kit push` |

These guards block the **most common** footgun. They do **not** protect against raw SQL in the Neon console or other tools that bypass this repo.

---

## Allowed DB workflows (ABQ)

| Command | When | Safe if |
|---|---|---|
| `npm run db:push` | Schema change on **ABQ Neon** | Host is `ep-blue-sky-*`; assert script passes |
| `npm run db:init -- --apply` | Fresh ABQ database only | Never on SFM; dry-run without `--apply` first |
| `npm run sync:legistar` | Normal ops | ABQ URL only |
| `npm run stt:transcribe` | Local STT (Civic Phase 2) | ABQ URL only; runs locally, not on Vercel |

---

## Forbidden

- Pointing ABQ Vercel env at SFM Neon “temporarily”
- Running ABQ `init-db` against any DB that has `event_id` on `meeting_videos`
- Using Santa Fe’s Neon console to “test” ABQ schema
- Copying SFM `DATABASE_URL` into ABQ `.env.local` for convenience

---

## What went wrong (for the record)

**Sep 2, 2026:** ABQ Phase 1 scaffold added `meeting_videos` + init scripts. Database setup ran against Santa Fe’s production Neon. SFM’s video table was replaced; transcript worker failed silently until Sep 3 evening.

**Root cause:** wrong `DATABASE_URL`, not cross-app API calls.

---

## If you think you pointed at the wrong database

1. **Stop.** Do not run `db:init`, `db:push`, or any DROP/CREATE.
2. Check hostname (snippet above).
3. If you hit Santa Fe’s Neon, notify the Santa Fe Minutes project immediately — they have repair scripts and monitoring.
4. Fix `.env.local` and Vercel env to ABQ’s Neon only.

---

## Related docs

- [sep-2026-sfm-db-clobber.md](sep-2026-sfm-db-clobber.md) — full incident timeline
- Santa Fe Minutes: `docs/database-isolation.md` — SFM-side rules and `verify-database-isolation.ts`
