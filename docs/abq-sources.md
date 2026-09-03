# Albuquerque data sources

The Albuquerque Minute admin pipeline ingests **City Council and related bodies** from Legistar, then attaches Granicus video when available.

## Legistar (meetings metadata)

| Field | Value |
|-------|-------|
| Client slug | `cabq` (not `albuquerque`) |
| API base | `https://webapi.legistar.com/v1/cabq` |
| Events | `GET /events` with OData `$filter` on `EventDate` |
| Sync window | 31 days lookback (~30) · 60 days lookahead (America/Denver) |
| Cron | Every 6 hours via `/api/cron/legistar-sync` |

### Bodies synced (EventBodyId)

Council and standing committees only — see `LEGISTAR_BODY_IDS` in `src/lib/legistar/config.ts`.

### Calendar.aspx vs REST API

`Calendar.aspx` can show **placeholder rows** (e.g. Sep 9 City Council from the published annual schedule) before the clerk creates a Legistar **Event**. Those dates are not in `GET /events` until an agenda is posted and the event is published — sync will pick them up automatically then. Do not scrape the calendar HTML.

### Video linkage

Legistar `EventMedia` holds the **Granicus clip id** when a recording exists. `EventVideoPath` is often null even when video is available — always prefer `EventMedia`.

## Granicus (Council video)

| Field | Value |
|-------|-------|
| Player | `https://cabq.granicus.com/player/clip/{clipId}?view_id=2&redirect=true` |
| HLS | Embedded in player HTML as `video_url="…/playlist.m3u8"` |
| STT | Phase 2 — Deepgram nova-2 via ffmpeg segment download |

**Do not use** city-hosted `/videos/{clip}/captions.vtt` — live auto-captions are garbled.

### Granicus fetch notes (STT smoke test)

- CloudFront returns 403 without browser User-Agent
- Use Chrome UA + `Referer: https://cabq.granicus.com/` → 200
- Recipe: GET player → regex `video_url` → `ffmpeg` → Deepgram

## YouTube (secondary / manual)

| Field | Value |
|-------|-------|
| Channel | `@GOVTVBoardsCommissionMeetings` |
| Role | Town halls, boards, commissions — **not** reliable Council archive |

v1: manual YouTube paste only. Auto-match is Phase 2+.

## Auth

- **Admin UI:** Clerk sign-in; allowlist via `ADMIN_EMAIL`
- **Cron routes:** `CRON_SECRET` (Bearer token or `?secret=`)

## Phase roadmap

1. **Phase 1 (current):** Legistar sync + admin meetings table
2. **Phase 2:** `meeting_transcripts` table, manual STT on 3–5 recent Council clips, then Hetzner worker
3. **Phase 3:** `/admin/article` — paste transcript → OpenRouter article draft
