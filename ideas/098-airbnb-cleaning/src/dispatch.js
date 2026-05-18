// Cleaning job creation + cleaner dispatch logic.
import { toReservations } from "./ical.js";

const HOUR = 3600_000;

function parseISO(s) {
  return s instanceof Date ? s : new Date(s);
}

// Generate cleaning jobs for new reservations.
// One job per check-out; scheduled to start at check-out time, finish before next check-in.
export function planCleanings({ reservations, existingJobs = [], defaultDurationHours = 3 }) {
  const seen = new Set(existingJobs.map((j) => j.reservationExternalId));
  const sorted = [...reservations].sort(
    (a, b) => parseISO(a.checkOut).getTime() - parseISO(b.checkOut).getTime()
  );
  const jobs = [];
  for (let i = 0; i < sorted.length; i++) {
    const res = sorted[i];
    if (seen.has(res.externalId)) continue;
    const start = parseISO(res.checkOut);
    const nextCheckIn = sorted
      .slice(i + 1)
      .find((r) => r.propertyId === res.propertyId);
    const latestEnd = nextCheckIn ? parseISO(nextCheckIn.checkIn) : new Date(start.getTime() + defaultDurationHours * HOUR);
    const durationHours = Math.min(
      defaultDurationHours,
      Math.max(1, (latestEnd.getTime() - start.getTime()) / HOUR)
    );
    jobs.push({
      id: `JOB-${res.externalId}`,
      propertyId: res.propertyId,
      reservationExternalId: res.externalId,
      startsAt: start.toISOString(),
      endsAt: new Date(start.getTime() + durationHours * HOUR).toISOString(),
      status: "unassigned",
      assignedCleanerId: null,
    });
  }
  return jobs;
}

// Pick best cleaner: highest priority, then highest rating, must be available.
export function assignCleaner(job, cleaners) {
  const candidates = cleaners.filter((c) => c.active && c.servicesProperty(job.propertyId));
  if (candidates.length === 0) throw new Error("no eligible cleaners");
  candidates.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return (b.rating ?? 0) - (a.rating ?? 0);
  });
  const chosen = candidates[0];
  return { ...job, status: "dispatched", assignedCleanerId: chosen.id };
}

// Build SMS payload for Twilio/Solapi.
export function buildSmsPayload(job, cleaner, propertyName) {
  const start = new Date(job.startsAt);
  const localDate = start.toISOString().slice(0, 16).replace("T", " ");
  return {
    to: cleaner.phone,
    body: `[TurnoSync] ${propertyName} 청소 요청\n${localDate} UTC 시작\n수락: https://turno.app/j/${job.id}`,
  };
}

// Mark cleaner response.
export function recordResponse(job, response) {
  if (job.status !== "dispatched") throw new Error("job not in dispatched state");
  if (response === "accept") return { ...job, status: "accepted", acceptedAt: new Date().toISOString() };
  if (response === "decline") return { ...job, status: "unassigned", assignedCleanerId: null };
  throw new Error(`unknown response ${response}`);
}

export function completeJob(job, { photoUrls = [], at = new Date() } = {}) {
  if (job.status !== "accepted") throw new Error("job must be accepted before completion");
  if (photoUrls.length === 0) throw new Error("at least one photo is required");
  return { ...job, status: "completed", completedAt: at.toISOString(), photoUrls };
}

// Convenience: parse iCal -> reservations -> jobs in one go (for cron worker).
export function syncProperty({ icalText, propertyId, existingJobs, parser }) {
  const events = parser(icalText);
  const reservations = toReservations(events, propertyId);
  const newJobs = planCleanings({ reservations, existingJobs });
  return { reservations, newJobs };
}
