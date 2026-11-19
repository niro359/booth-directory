// Which listings go on /texas-juried-show-deadlines/. Shared by the page
// builder and the preview-image renderer so both count the same rows.
import { daysBetween, withRecurrence } from "../../src/lib/schedule.js";

export function roundupRows(events, today) {
  return events
    .filter(e => !e.recurrence && !e.rollingDeadline)
    .map(e => withRecurrence(e, today))
    .filter(e => e.juried || e.type === "Art fair" || e.type === "Convention")
    .filter(e => e.deadline !== e.start) // a "deadline" that's just the show date means first come, not a real cutoff
    .filter(e => { const n = daysBetween(e.deadline, today); return n >= 0 && n <= 240; })
    .sort((a, b) => a.deadline.localeCompare(b.deadline));
}
