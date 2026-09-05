# Albuquerque data sources

The Albuquerque Minute admin pipeline ingests **city + joint meetings** into one `meetings` table, then attaches file URLs and video *pointers*. It does **not** run STT, Deepgram, or OpenRouter for the new sources.

> **Phase legend:** Phases in this file are **Civic pipeline** phases (this admin app). Newsletter launch phases live in [`data/abq-market/ABQ-COMPETITIVE-LANDSCAPE.md`](../data/abq-market/ABQ-COMPETITIVE-LANDSCAPE.md).

## Sync

| Field | Value |
|-------|-------|
| Window | 31 days lookback · 60 days lookahead (America/Denver) |
| Cron | Every 6 hours via `/api/cron/legistar-sync` (now runs **all** adapters) |
| Admin | **Sync meetings** → `/api/admin/sync-meetings` |
| CLI | `npm run sync:meetings` |

Unique key: `(source, source_id)` with `source_id` as **text**.

| `source` | What |
|----------|------|
| `legistar` | City Council + committees + Development Commission (`cabq` Legistar) |
| `legistar_abcwua` | Water Authority + advisory bodies (`abcwua` Legistar) |
| `planning` | EPC, ZHE, DHO, Landmarks (HTML) |
| `cpoa` | Civilian Police Oversight Advisory Board |
| `clerk_board` | Selected Clerk boards (per-page notices) |

YouTube is a **match method**, not a meeting source.

Bernalillo County CivicClerk is out of scope.

## Legistar (cabq + abcwua)

| Tenant | API | Source value |
|--------|-----|----------------|
| City | `https://webapi.legistar.com/v1/cabq` | `legistar` |
| Water | `https://webapi.legistar.com/v1/abcwua` | `legistar_abcwua` |

cabq body IDs: [`CABQ_TENANT`](../src/lib/legistar/config.ts) (includes Development Commission **50**).

abcwua body IDs: 39 (board), 49 (labor), 50 (TCAC), 51 (water protection).

The abcwua `GET /events` API currently returns 400 (`Agenda Draft Status` not configured). Sync falls back to [Calendar.aspx](https://abcwua.legistar.com/Calendar.aspx) HTML plus the [published 2026 board list](https://www.abcwua.org/your-water-authority-2026-meetings/).

`Calendar.aspx` can show **placeholder rows** before the clerk creates a Legistar Event. Do not scrape the calendar HTML.

`EventMedia` is the Granicus clip id. Prefer it over `EventVideoPath`.

## Planning / CPOA / boards (HTML)

| Body | Page |
|------|------|
| EPC | [agendas](https://www.cabq.gov/planning/boards-commissions/environmental-planning-commission/epc-agendas-reports-minutes) |
| ZHE | [agendas](https://www.cabq.gov/planning/boards-commissions/zoning-hearing-examiner/zhe-agendas-action-sheets-decisions) |
| DHO | [agendas](https://www.cabq.gov/planning/boards-commissions/development-hearing-officer/development-hearing-officer-agendas-archives) |
| Landmarks | [agendas](https://www.cabq.gov/planning/boards-commissions/landmarks-commission/landmarks-commission-agendas-action-sheets) |
| CPOA | [events](https://www.cabq.gov/cpoa/events) |
| Clerk boards | [directory](https://www.cabq.gov/clerk/boards-commissions) · pages in [`BOARD_PAGES`](../src/lib/boards/registry.ts) |

After a board meeting, PDFs move to [OnBase CQID=136](https://onbase.cabq.gov/publicaccess/?CQID=136). That UI is JS-only; we keep `agenda_url` as the board page when OnBase is not queryable.

## Video pointers (stored, not transcribed)

| Source | Pointer | Later audio path (not run) |
|--------|---------|----------------------------|
| Council / COW | Granicus via `EventMedia` | Existing [`stt.ts`](../src/lib/granicus/stt.ts) HLS → ffmpeg → Deepgram |
| cabq committees | Rare `EventMedia` | Same Granicus path |
| ABCWUA | `EventMedia` if present | Granicus or YouTube |
| Planning | Zoom recording / YouTube link on the materials page | Download that URL later |
| CPOA + boards | YouTube `@GOVTVBoardsCommissionMeetings` (`UCEqpcP42AmnpJPyuOy1jASQ`) | `yt-dlp` via [`src/lib/youtube/audio.ts`](../src/lib/youtube/audio.ts) — **throws until enabled** |

RSS: `https://www.youtube.com/feeds/videos.xml?channel_id=UCEqpcP42AmnpJPyuOy1jASQ`

Match: title date ±1 day + body tokens → `meeting_videos.youtube_id`, `match_method = youtube_title_date`.

**Do not** run `yt-dlp`, Deepgram, or OpenRouter for these pointers yet. `npm run stt:transcribe -- --youtube` is a hard error on purpose.

## Granicus (Council STT — already wired)

| Field | Value |
|-------|-------|
| Player | `https://cabq.granicus.com/player/clip/{clipId}?view_id=2&redirect=true` |
| HLS | `video_url="…/playlist.m3u8"` in player HTML |
| STT | Deepgram nova-2 via local CLI only |

Do not use city `/videos/{clip}/captions.vtt` (garbled live captions). CloudFront needs Chrome UA + `Referer: https://cabq.granicus.com/`.

```bash
npm run stt:transcribe -- --clip 556
npm run stt:transcribe -- --meeting-id 123
npm run stt:smoke -- --clip 556 --minutes 5
```

## Auth

- **Admin UI:** Clerk; `ADMIN_EMAIL`
- **Cron routes:** `CRON_SECRET`

## Civic phase roadmap

1. **Phase 1 (done):** Legistar sync + admin table
2. **Phase 2 (done):** transcripts + local Granicus STT CLI
3. **Phase 2c (this work):** multi-source ingest + video pointers
4. **Phase 2b (later):** Hetzner worker
5. **Phase 3 (not built):** `/admin/generate` — OpenRouter drafts
6. **Phase 2d (later):** YouTube/Zoom STT using stored pointers
