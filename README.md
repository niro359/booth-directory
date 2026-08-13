# Booth — Texas vendor & craft fair directory

A searchable directory of art shows, craft fairs, conventions, and standing
markets for artists and makers looking to vend in Texas. Static site (Vite +
React), single data file, no backend.

## Local development

```
npm install
npm run dev       # local dev server
npm run validate  # check data/events.json for structural problems
npm run build     # validates, then builds to dist/
npm run preview   # serve the built dist/ locally
```

## Updating listings

All event data lives in **`data/events.json`** — a plain array of objects.
Edit it directly (by hand, in GitHub's web editor, or with Claude Code).

Each listing has these fields:

| Field | Type | Notes |
|---|---|---|
| `id` | number | must be unique |
| `name`, `org`, `city`, `state` | string | |
| `type` | string | one of the values in `src/constants.js` (`TYPES`) |
| `start`, `end`, `deadline` | string | `YYYY-MM-DD` |
| `fee` | number | booth fee in dollars, `0` for consignment/no-fee |
| `attendance` | number | rough annual attendance |
| `juried` | boolean | true = panel/portfolio review required |
| `outdoor` | boolean | |
| `tags` | string[] | free-form, shown/searched as keywords |
| `desc` | string | 1-2 sentence description |
| `sourceUrl` | string | link to the organizer's official page/application — used to re-verify details |
| `lastVerified` | string or `null` | `YYYY-MM-DD` a human last confirmed this row's details |
| `status` | string | `"verified"` or `"needs-review"` |

### The QA workflow

1. Ask Claude Code (or do it yourself) to open a listing's `sourceUrl` and
   check the fee, dates, and jury requirements against what's in the JSON.
   Claude can fetch the page and propose an edit.
2. Review the **`git diff`** before committing — this is the human-in-the-loop
   checkpoint. Don't skip it; the validator checks structure, not truth.
3. Run `npm run validate` (or just `npm run build`, which runs it
   automatically as a `prebuild` step) to catch missing fields, bad dates,
   duplicate IDs, or a `type`/`status` outside the allowed values.
4. Commit and push. Cloudflare Pages rebuilds and deploys automatically.

Add a new listing by appending an object with the next unused `id` and
`status: "needs-review"` until it's been checked. Retire a listing by
deleting its object — no soft-delete/archive mechanism exists.

### Recurring (monthly) listings self-update — no manual date bumping

A listing that happens on a monthly cadence (tagged `"monthly"`, e.g. "first
Saturday of the month") can carry an optional `recurrence` object. When
present, the site computes that listing's *next* occurrence — and, where
possible, its deadline — from the visitor's own clock on every page load,
the same way the "N days left" badges already work. You never need to hand-edit
`start`/`end`/`deadline` for these listings again; just set the rule once.

```json
"recurrence": {
  "anchorWeekday": 6,          // 0=Sun .. 6=Sat — the day the rule is named after
  "ordinal": 1,                // 1st / 2nd / 3rd occurrence of that weekday in the month
  "offsetDays": 0,             // shift the event block relative to the anchor (see below)
  "spanDays": 1,               // how many consecutive days the event runs
  "activeMonths": [3, 4, 5],   // optional; omit to run every month
  "deadline": { "type": "daysBeforeStart", "days": 7 }
}
```

`deadline` is one of three shapes, whichever the organizer's own rule actually is:
- `{ "type": "daysBeforeStart", "days": N }` — deadline is N days before the event starts.
- `{ "type": "dayOfPriorMonth", "day": N }` — deadline is the Nth of the month *before* the event (e.g. Boerne Market Days: pay by the 1st of the prior month).
- `{ "type": "rolling" }` — no fixed cutoff exists (organizer takes applications on a rolling/contact basis). The card shows a "Rolling — no fixed deadline" badge instead of a countdown, and the listing is excluded from the Deadline Rail.

**`offsetDays` and "named day" vs. "start day":** for most markets the block
starts on the day it's named after (`offsetDays: 0` — e.g. "2nd Saturday" ⇒
anchor Saturday, block starts that Saturday). Some events are named after a day
*outside* the block itself — e.g. Canton's "First Monday Trade Days" actually
runs Thursday–Sunday *before* the first Monday — so `anchorWeekday: 1`
(Monday), `ordinal: 1`, `offsetDays: -4`, `spanDays: 4` finds the 1st Monday,
then steps back 4 days to Thursday.

The engine always picks the soonest occurrence whose application window is
still open (not just the soonest date on the calendar) — see `withRecurrence`
and `nextOccurrence` in `src/components/BoothDirectory.jsx`. The static
`start`/`end`/`deadline` fields stay in the JSON as a schema-valid fallback
and a sanity-check for human reviewers, but are overridden at render time
whenever `recurrence` is present. This only models a simple monthly cadence —
it does not handle one-off bonus dates some venues add on top of their normal
schedule (e.g. Boerne's extra December date); those still need a manual note
in `desc` or a separate listing entry.

### Countdown badges rebuild themselves

The "N days left" badges and the deadline rail are computed from the
visitor's local clock at page-load time, not baked in at build time. You only
need to redeploy when the actual listing data changes — there's no need for a
scheduled rebuild.

## Deploying (one-time setup)

This machine doesn't have the `gh` CLI installed, so finish these steps
manually:

1. Create a new GitHub repository (e.g. `booth-directory`) and push this
   project to it:
   ```
   git remote add origin <your-repo-url>
   git branch -M main
   git push -u origin main
   ```
2. In the [Cloudflare dashboard](https://dash.cloudflare.com/) → **Workers &
   Pages** → **Create application** → **Pages** → **Connect to Git**, select
   the repo, and set:
   - Build command: `npm run build`
   - Build output directory: `dist`
3. Every push to `main` will now auto-deploy.
4. Optional: buy a domain through Cloudflare Registrar (sold at cost, no
   markup) and attach it to the Pages project under its **Custom domains**
   tab.

## Saved listings

The "Saved" pin list persists per-browser via `localStorage` — there are no
user accounts, so saved items won't follow a visitor across devices.
