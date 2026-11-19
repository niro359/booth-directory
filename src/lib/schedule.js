// Shared date + URL logic. Plain ES module with no dependencies so it runs in
// three places: the React app (bundled by Vite), the static page builder
// (scripts/build-pages.mjs, in Node), and the static pages themselves
// (copied to dist/js/schedule.js and loaded with <script type="module">).

export const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export const MONTH_LONG = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export const parseDate = (s) => new Date(s + "T00:00:00");
export function startOfToday(now = new Date()) { const t = new Date(now); t.setHours(0, 0, 0, 0); return t; }
export const daysBetween = (s, today) => Math.round((parseDate(s) - today) / 86400000);

export function fmtShort(s) { const A = parseDate(s); return `${MON[A.getMonth()]} ${A.getDate()}`; }
export function fmtLong(s) { const A = parseDate(s); return `${MON[A.getMonth()]} ${A.getDate()}, ${A.getFullYear()}`; }
export function fmtRange(a, b) {
  const A = parseDate(a), B = parseDate(b);
  if (a === b) return `${MON[A.getMonth()]} ${A.getDate()}`;
  if (A.getMonth() === B.getMonth()) return `${MON[A.getMonth()]} ${A.getDate()}–${B.getDate()}`;
  return `${MON[A.getMonth()]} ${A.getDate()} – ${MON[B.getMonth()]} ${B.getDate()}`;
}
export function urgency(n) { return n < 0 ? "closed" : n <= 21 ? "soon" : n <= 60 ? "mid" : "far"; }

/* ---------- recurrence engine ----------
   A listing with a `recurrence` block computes its own next occurrence from
   the visitor's clock instead of carrying a hand-maintained date. See the
   README's "Recurring (monthly and weekly) listings" section for the schema. */
function nthWeekdayOfMonth(year, monthIndex, weekday, ordinal) {
  const first = new Date(year, monthIndex, 1);
  const shift = (weekday - first.getDay() + 7) % 7;
  return new Date(year, monthIndex, 1 + shift + (ordinal - 1) * 7);
}
function addDays(date, n) { const x = new Date(date); x.setDate(x.getDate() + n); return x; }
export function isoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
// All occurrences whose anchor day falls in the given month, in date order.
// `frequency: "weekly"` uses every matching weekday; otherwise `ordinal` picks
// the Nth weekday, and may be an array (e.g. [1, 3] for 1st and 3rd Saturdays).
function occurrencesFor(rec, year, monthIndex) {
  const ordinals = rec.frequency === "weekly" ? [1, 2, 3, 4, 5]
    : Array.isArray(rec.ordinal) ? rec.ordinal : [rec.ordinal];
  return ordinals
    .map(n => nthWeekdayOfMonth(year, monthIndex, rec.anchorWeekday, n))
    .filter(anchor => anchor.getMonth() === monthIndex)
    .sort((a, b) => a - b)
    .map(anchor => {
      const start = addDays(anchor, rec.offsetDays || 0);
      return { start, end: addDays(start, (rec.spanDays || 1) - 1) };
    });
}
function deadlineFor(rule, start) {
  if (!rule || rule.type === "rolling") return null;
  if (rule.type === "daysBeforeStart") return addDays(start, -rule.days);
  if (rule.type === "dayOfPriorMonth") return new Date(start.getFullYear(), start.getMonth() - 1, rule.day);
  return null;
}
// Soonest occurrence whose application window is still open.
export function nextOccurrence(rec, today) {
  let cursor = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  for (let i = 0; i < 24; i++) {
    const y = cursor.getFullYear(), m = cursor.getMonth();
    if (!rec.activeMonths || rec.activeMonths.includes(m + 1)) {
      for (const { start, end } of occurrencesFor(rec, y, m)) {
        const deadline = deadlineFor(rec.deadline, start);
        const isOpen = deadline ? deadline >= today : end >= today;
        if (isOpen) return { start: isoDate(start), end: isoDate(end), deadline: deadline && isoDate(deadline), rolling: !deadline };
      }
    }
    cursor = new Date(y, m + 1, 1);
  }
  return null;
}
export function withRecurrence(ev, today) {
  if (!ev.recurrence) return ev;
  const next = nextOccurrence(ev.recurrence, today);
  if (!next) return ev;
  return { ...ev, start: next.start, end: next.end, deadline: next.deadline || ev.deadline, rollingDeadline: next.rolling };
}

/* ---------- listing URLs ----------
   /events/<slug>/ — built from the name only, so an annual event keeps the
   same URL when it's rolled forward to next year's edition. Two listings
   with the same name get the city appended, then the id. */
export function slugify(s) {
  return s.toLowerCase()
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80).replace(/-+$/g, "");
}
export function slugMap(events) {
  const byName = new Map();
  for (const e of events) { const k = slugify(e.name); byName.set(k, (byName.get(k) || 0) + 1); }
  const used = new Set(), out = new Map();
  for (const e of [...events].sort((a, b) => a.id - b.id)) {
    let s = slugify(e.name);
    if (byName.get(s) > 1) s = slugify(`${e.name} ${e.city}`);
    if (used.has(s)) s = `${s}-${e.id}`;
    used.add(s); out.set(e.id, s);
  }
  return out;
}
export const eventPath = (slug) => `/events/${slug}/`;
