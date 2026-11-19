// Post-build step: writes plain static HTML pages next to the React app so
// crawlers and link previews (Facebook, Instagram, iMessage) see real content.
//
//   dist/events/<slug>/index.html          one page per listing
//   dist/texas-juried-show-deadlines/      roundup of juried / con deadlines
//   dist/sitemap.xml, dist/robots.txt      discovery
//   dist/js/schedule.js                    shared date logic, so each page
//                                          recomputes "N days left" (and the
//                                          next date of a recurring market) on
//                                          the visitor's clock, not build time
//
// Preview images come from public/og/<slug>.png (render them locally with
// `npm run og`); a listing without one falls back to public/og/default.png.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  startOfToday, daysBetween, fmtShort, fmtLong, fmtRange, withRecurrence,
  slugMap, eventPath, MONTH_LONG, parseDate,
} from "../src/lib/schedule.js";
import { roundupRows } from "./lib/roundup.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const SITE = "https://makermarketplaces.com";
const GROUP_URL = "https://www.facebook.com/groups/boothcrew/";
const IG_URL = "https://www.instagram.com/makermarketplaces/";
export const ROUNDUP_PATH = "/texas-juried-show-deadlines/";

const EVENTS = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "events.json"), "utf8"));
const TODAY = startOfToday();
const SLUGS = slugMap(EVENTS);

/* ---------- helpers ---------- */
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const jsonForScript = (o) => JSON.stringify(o).replace(/</g, "\\u003c");
const money = (n) => `$${n.toLocaleString("en-US")}`;
const feeText = (e) => e.fee == null ? "Not published yet" : e.fee === 0 ? "No booth fee" : `From ${money(e.fee)}`;
const feeShort = (e) => e.fee == null ? "TBA" : e.fee === 0 ? "No fee" : money(e.fee);
const admissionText = (e) => e.admissionFee == null ? "Unconfirmed" : e.admissionFee === 0 ? "Free" : money(e.admissionFee);
const attendanceText = (e) => `About ${e.attendance >= 1000 ? `${Math.round(e.attendance / 1000)}k` : e.attendance}`;
const entryText = (e) => e.juried ? "Juried (panel review)" : "Open registration";
const deadlineText = (e) => e.rollingDeadline ? "Rolling, no fixed deadline"
  : e.deadlineEstimated ? `About ${fmtLong(e.deadline)} (estimated)` : fmtLong(e.deadline);
const ogImage = (slug) => fs.existsSync(path.join(ROOT, "public", "og", `${slug}.png`)) ? `${SITE}/og/${slug}.png` : `${SITE}/og/default.png`;
const write = (rel, html) => {
  const out = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
};

/* ---------- shared page chrome ---------- */
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,400..900&family=DM+Mono:wght@400;500&family=Public+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">`;

function head({ title, description, canonical, image, jsonLd, extra = "" }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Maker Marketplaces">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
${FONTS}
<link rel="stylesheet" href="/css/pages.css">
${jsonLd ? `<script type="application/ld+json">${jsonForScript(jsonLd)}</script>` : ""}
${extra}
</head>`;
}

const topbar = `<header class="pg-top"><a class="pg-mark" href="/"><i></i>Maker Marketplaces</a><a class="pg-toplink" href="/"><span class="pg-wide">All Texas listings</span><span class="pg-narrow">All listings</span> →</a></header>`;
const crew = `<section class="pg-crew">
  <div>
    <div class="pg-kicker">Community · Free to join</div>
    <h2>Join the Booth <em>Crew</em></h2>
    <p>Texas makers comparing deadlines, booth fees and honest market reviews. A new Deadline Rail goes up every Monday.</p>
  </div>
  <div class="pg-crew-links">
    <a class="pg-btn" href="${GROUP_URL}" target="_blank" rel="noopener">Join on Facebook ↗</a>
    <a class="pg-sublink" href="${IG_URL}" target="_blank" rel="noopener">Follow on Instagram ↗</a>
  </div>
</section>`;
const footer = `<footer class="pg-foot">
  <div>Make the thing. Ship the thing. <b>Book the booth.</b></div>
  <div>© ${TODAY.getFullYear()} Maker Marketplaces. Not affiliated with any event organizer. Always confirm details with the organizer before you apply.</div>
</footer>`;

/* ---------- per-listing pages ---------- */
const current = EVENTS.map(e => withRecurrence(e, TODAY));
const upcomingDeadlines = current
  .filter(e => !e.rollingDeadline && daysBetween(e.deadline, TODAY) >= 0 && daysBetween(e.end, TODAY) >= 0)
  .sort((a, b) => a.deadline.localeCompare(b.deadline));

function eventPage(raw) {
  const e = withRecurrence(raw, TODAY);
  const slug = SLUGS.get(e.id);
  const url = SITE + eventPath(slug);
  const ended = daysBetween(e.end, TODAY) < 0;
  const year = parseDate(e.start).getFullYear();
  const recurring = !!raw.recurrence;
  const title = recurring
    ? `${e.name} vendor info: booth fee, how to apply | Maker Marketplaces`
    : `${e.name} ${year} vendor application: deadline, booth fee, jury | Maker Marketplaces`;
  const description = [
    `${e.name} in ${e.city}, ${e.state} (${e.type.toLowerCase()}, ${fmtRange(e.start, e.end)}${recurring ? "" : `, ${year}`}).`,
    e.rollingDeadline ? "Rolling applications." : `Apply by ${e.deadlineEstimated ? "about " : ""}${fmtShort(e.deadline)}${e.deadlineEstimated ? " (estimated)" : ""}.`,
    e.fee == null ? "Booth fee not published yet." : e.fee === 0 ? "No booth fee." : `Booth from ${money(e.fee)}.`,
    e.juried ? "Juried." : "Open registration.",
    e.status === "verified" && e.lastVerified ? `Checked against the organizer's page ${fmtShort(e.lastVerified)}.` : "",
  ].filter(Boolean).join(" ");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.name,
    description: e.desc,
    startDate: e.start,
    endDate: e.end,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: e.org, address: { "@type": "PostalAddress", addressLocality: e.city, addressRegion: e.state, addressCountry: "US" } },
    organizer: { "@type": "Organization", name: e.org, ...(e.sourceUrl ? { url: e.sourceUrl } : {}) },
    url,
    image: [ogImage(slug)],
  };

  const more = upcomingDeadlines.filter(x => x.id !== e.id).slice(0, 6);
  const live = { start: raw.start, end: raw.end, deadline: raw.deadline, rollingDeadline: !!raw.rollingDeadline, recurrence: raw.recurrence || null };

  return `${head({ title, description, canonical: url, image: ogImage(slug), jsonLd })}
<body class="pg">
<div class="pg-grain"></div>
<div class="pg-wrap">
${topbar}
<main>
  <article class="pg-event">
    <div class="pg-kicker">${esc(e.type)} · ${esc(e.city)}, ${esc(e.state)}${recurring ? " · Recurring" : ""}</div>
    <h1 class="pg-h1">${esc(e.name)}</h1>
    <p class="pg-org">${esc(e.org)}</p>
    ${ended ? `<p class="pg-note">This edition has ended. We'll update this page when the organizer posts the next dates.</p>` : ""}
    <div class="pg-badges" id="badges">
      <span class="pg-badge" id="days-badge" hidden></span>
      <span class="pg-badge ${e.juried ? "b-yellow" : "b-aqua"}">${e.juried ? "Juried" : "Open registration"}</span>
      ${e.outdoor ? `<span class="pg-badge b-mute">Outdoor</span>` : `<span class="pg-badge b-mute">Indoor</span>`}
      ${raw.tags.includes("monthly") ? `<span class="pg-badge b-mute">Monthly</span>` : ""}
      ${raw.tags.includes("weekly") ? `<span class="pg-badge b-mute">Weekly</span>` : ""}
    </div>

    <dl class="pg-facts">
      <div class="pg-fact hero"><dt>Apply by</dt><dd id="f-deadline">${esc(deadlineText(e))}</dd></div>
      <div class="pg-fact hero"><dt>Booth fee</dt><dd>${esc(feeText(e))}</dd></div>
      <div class="pg-fact hero"><dt>Entry</dt><dd>${esc(entryText(e))}</dd></div>
      <div class="pg-fact"><dt>${recurring ? "Next date" : "Event dates"}</dt><dd id="f-dates">${esc(fmtRange(e.start, e.end))}${recurring ? "" : `, ${year}`}</dd></div>
      <div class="pg-fact"><dt>Public admission</dt><dd>${esc(admissionText(e))}</dd></div>
      <div class="pg-fact"><dt>Attendance</dt><dd>${esc(attendanceText(e))}</dd></div>
    </dl>
    ${e.deadlineEstimated ? `<p class="pg-note">The deadline is estimated from last year's date. The organizer hasn't posted this year's yet, so check their page before you plan around it.</p>` : ""}

    <p class="pg-desc">${esc(e.desc)}</p>

    <div class="pg-verify">
      ${e.status === "verified"
        ? `<span class="pg-vbadge v-yes">✓ Checked against the organizer's page${e.lastVerified ? ` ${esc(fmtLong(e.lastVerified))}` : ""}</span>`
        : `<span class="pg-vbadge v-no">Not yet re-checked. Confirm details with the organizer before applying.</span>`}
    </div>
    <div class="pg-actions">
      ${e.sourceUrl ? `<a class="pg-btn" href="${esc(e.sourceUrl)}" target="_blank" rel="noopener">Apply on the organizer's site ↗</a>` : ""}
      <button class="pg-btn ghost" id="share" type="button">Share this listing</button>
      <span class="pg-copied" id="copied" hidden>Link copied</span>
    </div>
    <p class="pg-fine">Fees and dates change. The organizer's page is the final word.</p>
  </article>

  ${more.length ? `<section class="pg-more">
    <h2 class="pg-h2">Other deadlines coming up</h2>
    <ul class="pg-list">
      ${more.map(x => `<li data-deadline="${x.deadline}"><a href="${eventPath(SLUGS.get(x.id))}"><span class="pg-list-date">${x.deadlineEstimated ? "~" : ""}${esc(fmtShort(x.deadline))}</span><span class="pg-list-name">${esc(x.name)}</span><span class="pg-list-meta">${esc(x.city)} · ${esc(feeShort(x))}${x.juried ? " · juried" : ""}</span></a></li>`).join("\n      ")}
    </ul>
    <p class="pg-morelinks"><a href="${ROUNDUP_PATH}">Juried show &amp; artist alley deadlines</a> · <a href="/">Search all Texas listings</a></p>
  </section>` : ""}

  ${crew}
</main>
${footer}
</div>
<script type="application/json" id="ev-data">${jsonForScript(live)}</script>
<script type="module">
import { startOfToday, daysBetween, withRecurrence, fmtShort, fmtRange, urgency } from "/js/schedule.js";
const today = startOfToday();
const raw = JSON.parse(document.getElementById("ev-data").textContent);
const e = withRecurrence(raw, today);
if (raw.recurrence) {
  document.getElementById("f-dates").textContent = fmtRange(e.start, e.end);
  if (!e.rollingDeadline) document.getElementById("f-deadline").textContent = fmtShort(e.deadline);
}
const badge = document.getElementById("days-badge");
if (e.rollingDeadline) { badge.textContent = "Rolling applications"; badge.className = "pg-badge b-grass"; }
else {
  const n = daysBetween(e.deadline, today), u = urgency(n);
  badge.textContent = n < 0 ? "Deadline passed" : n === 0 ? "Closes today" : n + (n === 1 ? " day left" : " days left");
  badge.className = "pg-badge " + ({ closed: "b-mute", soon: "b-pink", mid: "b-yellow", far: "b-aqua" })[u];
}
badge.hidden = false;
document.querySelectorAll("[data-deadline]").forEach(li => { if (daysBetween(li.dataset.deadline, today) < 0) li.remove(); });
const btn = document.getElementById("share");
btn.addEventListener("click", async () => {
  const data = { title: document.title, url: location.href };
  try {
    if (navigator.share) await navigator.share(data);
    else { await navigator.clipboard.writeText(location.href); const c = document.getElementById("copied"); c.hidden = false; setTimeout(() => (c.hidden = true), 2000); }
  } catch {}
});
</script>
</body>
</html>`;
}

/* ---------- roundup: juried shows & artist alleys ---------- */
const roundupRowsNow = () => roundupRows(EVENTS, TODAY);

function roundupPage() {
  const rows = roundupRowsNow();
  const url = SITE + ROUNDUP_PATH;
  const showYears = [...new Set(rows.map(e => parseDate(e.start).getFullYear()))].sort();
  const season = showYears.length ? `${showYears.join(" & ")} shows` : "upcoming shows";
  const title = `Texas juried art fair & artist alley deadlines (${season}) | Maker Marketplaces`;
  const description = `Every upcoming application deadline for Texas juried art fairs, art festivals and convention artist alleys we track, with booth fees and jury info. ${rows.length} open calls, checked against organizer pages.`;
  const byMonth = new Map();
  for (const e of rows) {
    const dt = parseDate(e.deadline); const k = `${dt.getFullYear()}-${dt.getMonth()}`;
    if (!byMonth.has(k)) byMonth.set(k, { label: `${MONTH_LONG[dt.getMonth()]} ${dt.getFullYear()}`, rows: [] });
    byMonth.get(k).rows.push(e);
  }
  const jsonLd = {
    "@context": "https://schema.org", "@type": "ItemList", name: "Texas juried show and artist alley application deadlines",
    itemListElement: rows.map((e, i) => ({ "@type": "ListItem", position: i + 1, url: SITE + eventPath(SLUGS.get(e.id)), name: e.name })),
  };

  return `${head({ title, description, canonical: url, image: `${SITE}/og/juried-deadlines.png`, jsonLd })}
<body class="pg">
<div class="pg-grain"></div>
<div class="pg-wrap">
${topbar}
<main>
  <section class="pg-event">
    <div class="pg-kicker">Deadline season · Updated ${esc(fmtLong(`${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, "0")}-${String(TODAY.getDate()).padStart(2, "0")}`))}</div>
    <h1 class="pg-h1">Texas juried show &amp; artist alley <em>deadlines</em></h1>
    <p class="pg-lede">Spring art fairs and convention artist alleys close their calls months ahead, and most charge a jury fee to apply. These are the open calls we track in Texas, soonest first. Each one links to its listing and the organizer's application.</p>
    <p class="pg-fine">A "~" means the date is estimated from last year because the organizer hasn't posted this year's. Monthly markets and first-come shows aren't on this list. <a href="/">Search everything</a>.</p>
  </section>

  ${[...byMonth.values()].map(m => `<section class="pg-month" data-month>
    <h2 class="pg-h2">${esc(m.label)}</h2>
    <div class="pg-table" role="table">
      <div class="pg-tr pg-th" role="row"><span role="columnheader">Apply by</span><span role="columnheader">Show</span><span role="columnheader">Booth</span><span role="columnheader">Entry</span></div>
      ${m.rows.map(e => `<a class="pg-tr" role="row" href="${eventPath(SLUGS.get(e.id))}" data-deadline="${e.deadline}">
        <span class="pg-td-date" role="cell"><b>${e.deadlineEstimated ? "~" : ""}${esc(fmtShort(e.deadline))}</b><i class="pg-left" hidden></i></span>
        <span class="pg-td-name" role="cell"><b>${esc(e.name)}</b><small>${esc(e.city)} · ${esc(fmtRange(e.start, e.end))}, ${parseDate(e.start).getFullYear()} · ${esc(e.type)}</small></span>
        <span role="cell">${esc(feeShort(e))}</span>
        <span role="cell">${e.juried ? "Juried" : "Open"}${e.status !== "verified" ? `<small class="pg-unv">not re-checked</small>` : ""}</span>
      </a>`).join("\n      ")}
    </div>
  </section>`).join("\n  ")}

  ${crew}
</main>
${footer}
</div>
<script type="module">
import { startOfToday, daysBetween, urgency } from "/js/schedule.js";
const today = startOfToday();
document.querySelectorAll("[data-deadline]").forEach(r => {
  const n = daysBetween(r.dataset.deadline, today);
  if (n < 0) { r.remove(); return; }
  const tag = r.querySelector(".pg-left");
  tag.textContent = n === 0 ? "today" : n + "d left"; tag.className = "pg-left u-" + urgency(n); tag.hidden = false;
});
document.querySelectorAll("[data-month]").forEach(m => { if (!m.querySelector("[data-deadline]")) m.remove(); });
</script>
</body>
</html>`;
}

/* ---------- CSS (same inks and type as the app) ---------- */
const CSS = `:root{--stock:#E7E7E1;--stock-2:#F3F3EF;--ink:#16182B;--ink-70:rgba(22,24,43,.7);--ink-45:rgba(22,24,43,.45);--ink-15:rgba(22,24,43,.15);--ink-08:rgba(22,24,43,.08);
--pink:#FF4B7D;--aqua:#00A0AE;--yellow:#FFC42E;--grass:#3E8E5A;
--f-display:'Archivo','Helvetica Neue',Arial,sans-serif;--f-body:'Public Sans',system-ui,-apple-system,sans-serif;--f-data:'DM Mono',ui-monospace,Menlo,monospace;}
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0}
body.pg{background:var(--stock);color:var(--ink);font-family:var(--f-body);-webkit-font-smoothing:antialiased;min-height:100vh}
.pg ::selection{background:var(--yellow)}
.pg a{color:inherit}
.pg :focus-visible{outline:3px solid var(--aqua);outline-offset:2px}
.pg-grain{position:fixed;inset:0;pointer-events:none;z-index:60;opacity:.35;background-image:radial-gradient(var(--ink-08) .5px,transparent .5px);background-size:3px 3px}
.pg-wrap{max-width:920px;margin:0 auto;padding:0 16px 60px}
.pg-top{display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:2px solid var(--ink)}
.pg-mark{font-family:var(--f-display);font-weight:900;font-stretch:118%;font-size:clamp(14px,2.4vw,20px);letter-spacing:-.015em;text-transform:uppercase;display:flex;align-items:center;gap:8px;text-decoration:none;white-space:nowrap}
.pg-mark i{display:inline-block;width:11px;height:22px;background:var(--pink);box-shadow:4px 0 0 var(--aqua)}
.pg-toplink{margin-left:auto;font-family:var(--f-data);font-size:12px;letter-spacing:.04em;text-decoration:none;border-bottom:1.5px solid var(--pink);white-space:nowrap}
.pg-kicker{font-family:var(--f-data);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-45);margin-bottom:10px}
.pg-event{padding:30px 0 10px}
.pg-h1{font-family:var(--f-display);font-weight:900;font-stretch:122%;font-size:clamp(32px,6.4vw,60px);line-height:.95;letter-spacing:-.03em;text-transform:uppercase;margin:0 0 8px;overflow-wrap:anywhere}
.pg-h1 em{font-style:normal;color:var(--pink)}
.pg-h2{font-family:var(--f-display);font-weight:800;font-stretch:115%;font-size:20px;text-transform:uppercase;letter-spacing:-.01em;margin:0 0 12px}
.pg-org{font-family:var(--f-data);font-size:13px;color:var(--ink-70);margin:0 0 16px}
.pg-lede{font-size:16px;line-height:1.55;max-width:60ch;color:var(--ink-70);margin:6px 0 10px}
.pg-badges{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 18px}
.pg-badge{font-family:var(--f-data);font-size:11px;letter-spacing:.06em;text-transform:uppercase;border:1.5px solid var(--ink);padding:4px 9px;background:var(--stock-2)}
.pg-badge.b-pink{background:var(--pink);color:#fff}.pg-badge.b-yellow{background:var(--yellow)}.pg-badge.b-aqua{background:var(--aqua);color:#fff}
.pg-badge.b-grass{background:var(--grass);color:#fff}.pg-badge.b-mute{border-color:var(--ink-15);color:var(--ink-70);background:none}
.pg-facts{display:grid;grid-template-columns:repeat(3,1fr);gap:0;margin:0 0 14px;border:2.5px solid var(--ink);background:var(--stock-2);box-shadow:6px 6px 0 var(--aqua),12px 12px 0 var(--pink)}
.pg-fact{padding:12px 14px;border-right:1.5px solid var(--ink-15);border-bottom:1.5px solid var(--ink-15);margin:0}
.pg-fact:nth-child(3n){border-right:none}.pg-fact:nth-child(n+4){border-bottom:none}
.pg-fact dt{font-family:var(--f-data);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-45);margin-bottom:4px}
.pg-fact dd{margin:0;font-family:var(--f-data);font-size:14px;font-weight:500}
.pg-fact.hero dd{font-family:var(--f-display);font-weight:800;font-stretch:110%;font-size:clamp(17px,2.6vw,22px);line-height:1.1}
.pg-note{font-size:14px;line-height:1.5;border-left:4px solid var(--yellow);padding:6px 12px;background:var(--stock-2);margin:18px 0 0}
.pg-desc{font-size:16.5px;line-height:1.6;max-width:62ch;margin:22px 0 18px}
.pg-verify{margin-bottom:14px}
.pg-vbadge{font-family:var(--f-data);font-size:11px;letter-spacing:.05em;border:1.5px solid var(--ink);padding:4px 8px;display:inline-block}
.pg-vbadge.v-yes{background:var(--grass);border-color:var(--grass);color:#fff}.pg-vbadge.v-no{background:var(--yellow)}
.pg-actions{display:flex;flex-wrap:wrap;align-items:center;gap:12px}
.pg-btn{display:inline-flex;align-items:center;gap:6px;font-family:var(--f-data);font-size:13px;letter-spacing:.04em;border:2px solid var(--ink);background:var(--pink);color:#fff !important;padding:10px 16px;text-decoration:none;cursor:pointer;transition:transform .18s cubic-bezier(.2,1.5,.4,1),box-shadow .18s}
.pg-btn:hover{transform:translate(-2px,-2px);box-shadow:3px 4px 0 var(--ink)}
.pg-btn:active{transform:scale(.96)}
.pg-btn.ghost{background:var(--stock-2);color:var(--ink) !important}
.pg-copied{font-family:var(--f-data);font-size:12px;color:var(--grass)}
.pg-fine{font-family:var(--f-data);font-size:11.5px;line-height:1.6;color:var(--ink-45);margin:14px 0 0}
.pg-more{margin:40px 0 0;padding-top:20px;border-top:2px solid var(--ink)}
.pg-list{list-style:none;margin:0;padding:0}
.pg-list a{display:grid;grid-template-columns:70px 1fr auto;gap:12px;align-items:baseline;padding:10px 0;border-bottom:1.5px solid var(--ink-15);text-decoration:none}
.pg-list a:hover .pg-list-name{color:var(--pink)}
.pg-list-date{font-family:var(--f-data);font-size:13px;font-weight:500}
.pg-list-name{font-weight:700}
.pg-list-meta{font-family:var(--f-data);font-size:12px;color:var(--ink-45);text-align:right}
.pg-morelinks{font-family:var(--f-data);font-size:12px;margin:14px 0 0}
.pg-month{margin:30px 0 0}
.pg-table{border:2.5px solid var(--ink);background:var(--stock-2)}
.pg-tr{display:grid;grid-template-columns:108px 1fr 74px 92px;gap:12px;align-items:center;padding:12px 14px;border-bottom:1.5px solid var(--ink-15);text-decoration:none}
.pg-tr:last-child{border-bottom:none}
a.pg-tr:hover{background:#fff}a.pg-tr:hover b{color:var(--pink)}
.pg-th{font-family:var(--f-data);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-45);padding:8px 14px}
.pg-tr > span{font-family:var(--f-data);font-size:13px}
.pg-td-date b{display:block;font-size:15px}
.pg-td-name b{display:block;font-family:var(--f-body);font-size:15.5px}
.pg-td-name small,.pg-unv{display:block;font-size:11.5px;color:var(--ink-45);margin-top:2px}
.pg-left{display:inline-block;font-style:normal;font-size:10.5px;letter-spacing:.05em;text-transform:uppercase;margin-top:4px;padding:1px 6px;border:1.5px solid var(--ink)}
.pg-left.u-soon{background:var(--pink);color:#fff}.pg-left.u-mid{background:var(--yellow)}.pg-left.u-far{background:var(--aqua);color:#fff}
.pg-crew{margin:48px 0 0;padding:22px;border:2.5px solid var(--ink);background:var(--yellow);display:flex;gap:20px;flex-wrap:wrap;align-items:center;justify-content:space-between}
.pg-crew h2{font-family:var(--f-display);font-weight:900;font-stretch:120%;text-transform:uppercase;font-size:clamp(24px,4vw,34px);margin:0 0 6px;line-height:1}
.pg-crew h2 em{font-style:normal;color:var(--pink)}
.pg-crew p{margin:0;max-width:48ch;line-height:1.5}
.pg-crew .pg-kicker{color:var(--ink-70)}
.pg-crew-links{display:flex;flex-direction:column;gap:10px;align-items:flex-start}
.pg-sublink{font-family:var(--f-data);font-size:12px;border-bottom:1.5px dotted var(--ink);text-decoration:none}
.pg-foot{margin-top:40px;border-top:2px solid var(--ink);padding-top:14px;font-family:var(--f-data);font-size:11.5px;color:var(--ink-45);display:flex;flex-direction:column;gap:6px}
.pg-foot b{color:var(--ink);font-weight:500}
.pg-narrow{display:none}
@media (max-width:440px){.pg-wide{display:none}.pg-narrow{display:inline}.pg-mark{font-size:13px;gap:6px}.pg-toplink{font-size:11px}}
@media (max-width:640px){
  .pg-facts{grid-template-columns:1fr 1fr;box-shadow:4px 4px 0 var(--aqua),8px 8px 0 var(--pink)}
  .pg-fact{border-right:1.5px solid var(--ink-15) !important;border-bottom:1.5px solid var(--ink-15) !important}
  .pg-fact:nth-child(2n){border-right:none !important}
  .pg-fact:nth-child(n+5){border-bottom:none !important}
  .pg-tr{grid-template-columns:78px 1fr;row-gap:4px}
  .pg-th{display:none}
  .pg-tr > span:nth-child(3),.pg-tr > span:nth-child(4){grid-column:2;display:inline;font-size:12px;color:var(--ink-70)}
  .pg-tr > span:nth-child(3)::before{content:"Booth "}
  .pg-list a{grid-template-columns:58px 1fr}
  .pg-list-meta{grid-column:2;text-align:left}
}`;

/* ---------- sitemap + robots ---------- */
function sitemap(paths) {
  const today = startOfToday().toISOString().slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map(p => `  <url><loc>${SITE}${p}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>
`;
}

/* ---------- run ---------- */
if (!fs.existsSync(DIST)) throw new Error("dist/ not found. Run vite build first.");
fs.mkdirSync(path.join(DIST, "js"), { recursive: true });
fs.copyFileSync(path.join(ROOT, "src", "lib", "schedule.js"), path.join(DIST, "js", "schedule.js"));
write("css/pages.css", CSS);

const listed = [];
for (const raw of EVENTS) {
  const slug = SLUGS.get(raw.id);
  write(path.join("events", slug, "index.html"), eventPage(raw));
  const e = withRecurrence(raw, TODAY);
  if (daysBetween(e.end, TODAY) >= 0) listed.push(eventPath(slug));
}
write(path.join(ROUNDUP_PATH, "index.html"), roundupPage());
write("sitemap.xml", sitemap(["/", ROUNDUP_PATH, ...listed]));
const robots = fs.existsSync(path.join(DIST, "robots.txt")) ? fs.readFileSync(path.join(DIST, "robots.txt"), "utf8").trimEnd() : "User-agent: *\nAllow: /";
if (!robots.includes("Sitemap:")) write("robots.txt", `${robots}\n\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`build-pages: ${EVENTS.length} listing pages (${listed.length} current, in sitemap), roundup with ${roundupRowsNow().length} deadlines`);
