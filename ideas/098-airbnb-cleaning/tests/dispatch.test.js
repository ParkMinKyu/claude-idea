import { describe, it, expect } from "vitest";
import { parseICal } from "../src/ical.js";
import {
  planCleanings,
  assignCleaner,
  buildSmsPayload,
  recordResponse,
  completeJob,
  syncProperty,
} from "../src/dispatch.js";

const sampleIcal = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:res-001@airbnb.com
DTSTART:20260601T140000Z
DTEND:20260603T110000Z
SUMMARY:Reserved
END:VEVENT
BEGIN:VEVENT
UID:res-002@airbnb.com
DTSTART:20260603T140000Z
DTEND:20260605T110000Z
SUMMARY:Reserved
END:VEVENT
END:VCALENDAR`;

describe("parseICal", () => {
  it("extracts events with UID/DTSTART/DTEND", () => {
    const events = parseICal(sampleIcal);
    expect(events).toHaveLength(2);
    expect(events[0].uid).toBe("res-001@airbnb.com");
    expect(events[0].dtstart.toISOString()).toBe("2026-06-01T14:00:00.000Z");
  });

  it("ignores malformed lines", () => {
    const text = "BEGIN:VEVENT\nGARBAGE\nUID:x\nDTSTART:20260101T000000Z\nDTEND:20260102T000000Z\nEND:VEVENT";
    expect(parseICal(text)).toHaveLength(1);
  });
});

describe("planCleanings", () => {
  it("creates one job per reservation checkout", () => {
    const { newJobs } = syncProperty({ icalText: sampleIcal, propertyId: "P1", existingJobs: [], parser: parseICal });
    expect(newJobs).toHaveLength(2);
    expect(newJobs[0].startsAt).toBe("2026-06-03T11:00:00.000Z");
  });

  it("skips reservations that already have jobs (idempotent)", () => {
    const reservations = [
      { externalId: "r1", propertyId: "P1", checkIn: "2026-06-01T14:00Z", checkOut: "2026-06-03T11:00Z" },
    ];
    const jobs = planCleanings({ reservations, existingJobs: [{ reservationExternalId: "r1" }] });
    expect(jobs).toHaveLength(0);
  });

  it("shrinks duration when next check-in is close", () => {
    const reservations = [
      { externalId: "r1", propertyId: "P1", checkIn: "2026-06-01T14:00Z", checkOut: "2026-06-03T11:00Z" },
      { externalId: "r2", propertyId: "P1", checkIn: "2026-06-03T13:00Z", checkOut: "2026-06-05T11:00Z" },
    ];
    const jobs = planCleanings({ reservations, defaultDurationHours: 4 });
    // gap is 2h, so duration clamps to 2
    const first = jobs.find((j) => j.reservationExternalId === "r1");
    const dur = (new Date(first.endsAt) - new Date(first.startsAt)) / 3600000;
    expect(dur).toBe(2);
  });
});

describe("assignCleaner", () => {
  const cleaners = [
    { id: "C1", phone: "+1", priority: 5, rating: 4.5, active: true, servicesProperty: () => true },
    { id: "C2", phone: "+2", priority: 10, rating: 4.0, active: true, servicesProperty: () => true },
    { id: "C3", phone: "+3", priority: 10, rating: 4.9, active: false, servicesProperty: () => true },
  ];
  it("picks highest priority active cleaner", () => {
    const job = { id: "J1", propertyId: "P1", status: "unassigned" };
    const out = assignCleaner(job, cleaners);
    expect(out.assignedCleanerId).toBe("C2");
    expect(out.status).toBe("dispatched");
  });
  it("throws when no eligible cleaners", () => {
    expect(() => assignCleaner({ propertyId: "P1" }, [])).toThrow(/no eligible/);
  });
});

describe("sms + response + completion flow", () => {
  it("builds SMS payload with property + time", () => {
    const job = { id: "J1", startsAt: "2026-06-03T11:00:00Z" };
    const sms = buildSmsPayload(job, { phone: "+82101234" }, "Hongdae Loft");
    expect(sms.to).toBe("+82101234");
    expect(sms.body).toContain("Hongdae Loft");
    expect(sms.body).toContain("J1");
  });

  it("accept moves dispatched -> accepted", () => {
    const out = recordResponse({ status: "dispatched" }, "accept");
    expect(out.status).toBe("accepted");
  });

  it("decline returns to unassigned", () => {
    const out = recordResponse({ status: "dispatched", assignedCleanerId: "C1" }, "decline");
    expect(out.status).toBe("unassigned");
    expect(out.assignedCleanerId).toBeNull();
  });

  it("requires photos to complete", () => {
    expect(() => completeJob({ status: "accepted" })).toThrow(/photo/);
    const done = completeJob({ status: "accepted" }, { photoUrls: ["x.jpg"] });
    expect(done.status).toBe("completed");
  });
});
