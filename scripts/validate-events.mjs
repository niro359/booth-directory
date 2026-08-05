import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { TYPES, STATUSES } from "../src/constants.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, "..", "data", "events.json");

const REQUIRED_FIELDS = {
  id: "number",
  name: "string",
  org: "string",
  city: "string",
  state: "string",
  type: "string",
  start: "string",
  end: "string",
  deadline: "string",
  fee: "number",
  attendance: "number",
  juried: "boolean",
  outdoor: "boolean",
  tags: "array",
  desc: "string",
  status: "string",
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function typeOf(v) {
  if (Array.isArray(v)) return "array";
  return typeof v;
}

function isValidDate(s) {
  if (typeof s !== "string" || !DATE_RE.test(s)) return false;
  const d = new Date(s + "T00:00:00");
  return !Number.isNaN(d.getTime());
}

function main() {
  let raw;
  try {
    raw = readFileSync(DATA_PATH, "utf8");
  } catch (err) {
    console.error(`✗ Could not read ${DATA_PATH}: ${err.message}`);
    process.exit(1);
  }

  let events;
  try {
    events = JSON.parse(raw);
  } catch (err) {
    console.error(`✗ data/events.json is not valid JSON: ${err.message}`);
    process.exit(1);
  }

  if (!Array.isArray(events)) {
    console.error("✗ data/events.json must be a top-level array of event objects.");
    process.exit(1);
  }

  const errors = [];
  const warnings = [];
  const seenIds = new Set();

  events.forEach((ev, i) => {
    const label = ev && ev.name ? `"${ev.name}" (index ${i})` : `index ${i}`;

    for (const [field, expected] of Object.entries(REQUIRED_FIELDS)) {
      if (!(field in ev)) {
        errors.push(`${label}: missing required field "${field}"`);
        continue;
      }
      if (typeOf(ev[field]) !== expected) {
        errors.push(`${label}: field "${field}" should be ${expected}, got ${typeOf(ev[field])}`);
      }
    }

    if (typeof ev.id === "number") {
      if (seenIds.has(ev.id)) errors.push(`${label}: duplicate id ${ev.id}`);
      seenIds.add(ev.id);
    }

    if (typeof ev.type === "string" && !TYPES.includes(ev.type)) {
      errors.push(`${label}: type "${ev.type}" is not one of ${JSON.stringify(TYPES)}`);
    }

    if (typeof ev.status === "string" && !STATUSES.includes(ev.status)) {
      errors.push(`${label}: status "${ev.status}" is not one of ${JSON.stringify(STATUSES)}`);
    }

    for (const field of ["start", "end", "deadline"]) {
      if (typeof ev[field] === "string" && !isValidDate(ev[field])) {
        errors.push(`${label}: field "${field}" (${ev[field]}) is not a valid YYYY-MM-DD date`);
      }
    }

    if (isValidDate(ev.start) && isValidDate(ev.end)) {
      if (new Date(ev.end + "T00:00:00") < new Date(ev.start + "T00:00:00")) {
        errors.push(`${label}: "end" (${ev.end}) is before "start" (${ev.start})`);
      }
    }

    if (typeof ev.fee === "number" && ev.fee < 0) {
      errors.push(`${label}: "fee" cannot be negative (${ev.fee})`);
    }
    if (typeof ev.attendance === "number" && ev.attendance < 0) {
      errors.push(`${label}: "attendance" cannot be negative (${ev.attendance})`);
    }

    if (isValidDate(ev.deadline) && isValidDate(ev.start)) {
      if (new Date(ev.deadline + "T00:00:00") > new Date(ev.start + "T00:00:00")) {
        warnings.push(`${label}: "deadline" (${ev.deadline}) falls after "start" (${ev.start}) — confirm this is intentional (e.g. rolling/consignment entry)`);
      }
    }

    if (ev.status === "verified") {
      if (!ev.sourceUrl) warnings.push(`${label}: status is "verified" but "sourceUrl" is empty`);
      if (!ev.lastVerified) warnings.push(`${label}: status is "verified" but "lastVerified" is not set`);
    }
  });

  if (warnings.length) {
    console.warn(`⚠ ${warnings.length} warning(s):`);
    warnings.forEach(w => console.warn(`  - ${w}`));
  }

  if (errors.length) {
    console.error(`✗ ${errors.length} error(s) in data/events.json:`);
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log(`✓ data/events.json is valid (${events.length} listings).`);
}

main();
