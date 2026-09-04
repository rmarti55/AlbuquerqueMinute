# Catskill Crew Research Corpus

Local archive of public Catskill Crew newsletter issues for competitive analysis and editorial research in Cursor.

## Contents

- `STRATEGIC-REFERENCE.md` — monetization playbook and ABQ launch implications
- `CADENCE-PLAYBOOK.md` — publish cadence, coverage windows, edition #1 template (copy for ABQ launch)
- `catalog.md` — scannable index of all issues (start here)
- `catalog.json` — machine-readable index
- `issues/YYYY/YYYY-MM-DD-slug.md` — one file per issue with YAML frontmatter
- `meta/stats.json` — corpus statistics
- `meta/fetch-log.json` — last sync run details

## Corpus

- **Issues:** 147
- **Date range:** 2023-11-27 → 2026-09-01
- **First edition:** `issues/2023/2023-11-27-catskill-crew-newsletter-b178.md`
- **Latest edition:** `issues/2026/2026-09-01-launch-calendar.md`

## Using in Cursor

Reference these paths in chat:

- `@data/catskill-crew/STRATEGIC-REFERENCE.md` — strategic playbook and revenue analysis
- `@data/catskill-crew/CADENCE-PLAYBOOK.md` — cadence, format, launch checklist
- `@data/catskill-crew/catalog.md` — overview and navigation
- `@data/catskill-crew/issues/2024/` — analyze a specific year
- `@data/catskill-crew/issues/2023/2023-11-27-catskill-crew-newsletter-b178.md` — first edition baseline

### Example prompts

- Analyze recurring editorial formats across `@data/catskill-crew/catalog.md`
- Compare voice and tone in the first 10 vs last 10 issues
- Extract event-listing patterns from 2024 issues
- What monetization or partner blocks does Catskill Crew use?
- How did section structure evolve from 2023 to 2026?

## Sync

```bash
npm run sync:catskill-crew
```

Re-running is safe; it refreshes all issue files and catalogs.
