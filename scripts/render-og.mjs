// Render link-preview images (1200x630) into public/og/ with local headless
// Edge, the same way social/tools/render.sh makes the social graphics.
// Runs on this Windows machine only; the PNGs are committed, so the
// Cloudflare build never needs a browser.
//
//   npm run og            render images whose content changed
//   npm run og -- --all   re-render everything
//
// public/og/manifest.json remembers what each image showed, so a listing is
// only re-rendered when its name, deadline, fee or jury info changes.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { startOfToday, fmtShort, withRecurrence, slugMap, daysBetween } from "../src/lib/schedule.js";
import { roundupRows } from "./lib/roundup.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "og");
const TEMPLATE = pathToFileURL(path.join(ROOT, "scripts", "og", "template.html")).href;
const EDGE = ["C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe"].find(fs.existsSync);
if (!EDGE) throw new Error("Microsoft Edge not found; this script renders with headless Edge.");

const ALL = process.argv.includes("--all");
const EVENTS = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "events.json"), "utf8"));
const TODAY = startOfToday();
const SLUGS = slugMap(EVENTS);
const MANIFEST = path.join(OUT, "manifest.json");
fs.mkdirSync(OUT, { recursive: true });
const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : {};
const PROFILE = path.join(os.tmpdir(), "mm-og-edgeprof");

const money = (n) => `$${n.toLocaleString("en-US")}`;
const b64url = (o) => Buffer.from(JSON.stringify(o), "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

function render(name, data) {
  const key = JSON.stringify(data);
  const file = path.join(OUT, `${name}.png`);
  if (!ALL && manifest[name] === key && fs.existsSync(file)) return false;
  const tmp = path.join(OUT, `_render.png`);
  fs.rmSync(tmp, { force: true });
  try {
    execFileSync(EDGE, [
      "--headless=new", `--user-data-dir=${PROFILE}`, "--disable-gpu", "--hide-scrollbars",
      "--force-device-scale-factor=1", "--virtual-time-budget=8000", "--window-size=1200,630",
      `--screenshot=${tmp}`, `${TEMPLATE}#${b64url(data)}`,
    ], { stdio: "ignore", timeout: 60000 });
  } catch { /* Edge exits non-zero on some machines even when the screenshot is written */ }
  if (!fs.existsSync(tmp)) throw new Error(`render failed: ${name}`);
  fs.renameSync(tmp, file);
  manifest[name] = key;
  return true;
}

function eventCard(raw) {
  const e = withRecurrence(raw, TODAY);
  const recurring = !!raw.recurrence;
  const cadence = raw.tags.includes("weekly") ? "Weekly" : raw.tags.includes("monthly") ? "Monthly" : "Recurring";
  const apply = e.rollingDeadline ? ["Apply", "Rolling"]
    : recurring ? ["Apply", cadence]
    : ["Apply by", `${e.deadlineEstimated ? "~" : ""}${fmtShort(e.deadline)}`, e.deadlineEstimated ? "est." : ""];
  return {
    kicker: `${e.type} · ${e.city}, ${e.state}`,
    title: e.name,
    facts: [
      apply,
      ["Booth", e.fee == null ? "TBA" : e.fee === 0 ? "No fee" : money(e.fee)],
      ["Entry", e.juried ? "Juried" : "Open"],
    ],
    foot: e.status === "verified" && e.lastVerified
      ? `<b>✓</b> checked ${fmtShort(e.lastVerified)} · makermarketplaces.com`
      : "makermarketplaces.com",
  };
}

let made = 0, kept = 0;
const tick = (did) => did ? made++ : kept++;

tick(render("default", {
  kicker: "Texas craft fairs · art shows · artist alleys",
  titleHtml: "Find the booth before the <em>deadline</em> finds you.",
  sub: "Deadlines, booth fees and jury info up front, checked against each organizer's page.",
  size: 76,
  facts: [
    ["Texas listings", String(EVENTS.filter(e => daysBetween(withRecurrence(e, TODAY).end, TODAY) >= 0).length)],
    ["Every card shows", "Deadline · Fee · Jury"],
  ],
}));

const rows = roundupRows(EVENTS, TODAY);
tick(render("juried-deadlines", {
  kicker: "Deadline season · Texas",
  titleHtml: "Juried show &amp; artist alley <em>deadlines</em>",
  facts: [["Open calls", String(rows.length)], ["Next closes", rows[0] ? fmtShort(rows[0].deadline) : "–"]],
  size: 80,
}));

for (const raw of EVENTS) {
  const e = withRecurrence(raw, TODAY);
  if (daysBetween(e.end, TODAY) < 0) continue; // ended: page falls back to default.png
  const did = render(SLUGS.get(raw.id), eventCard(raw));
  tick(did);
  if (did) process.stdout.write(".");
}
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1) + "\n");
console.log(`\nog: rendered ${made}, unchanged ${kept}`);
