// Minimal RFC 5545 parser — handles the subset Airbnb/Vrbo emit.
// Real product would use `node-ical`; we keep zero deps for the MVP.

function unfold(text) {
  // RFC 5545 line folding: a line beginning with space/tab continues previous line.
  return text.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
}

function parseICalDate(value) {
  // Forms: 20260601, 20260601T130000Z
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})Z?)?$/);
  if (!m) throw new Error(`unparseable date: ${value}`);
  const [, y, mo, d, hh = "00", mm = "00", ss = "00"] = m;
  return new Date(Date.UTC(+y, +mo - 1, +d, +hh, +mm, +ss));
}

export function parseICal(text) {
  const lines = unfold(text).split(/\r?\n/);
  const events = [];
  let current = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") current = {};
    else if (line === "END:VEVENT") {
      if (current && current.uid && current.dtstart && current.dtend) {
        events.push(current);
      }
      current = null;
    } else if (current) {
      const idx = line.indexOf(":");
      if (idx === -1) continue;
      const rawKey = line.slice(0, idx);
      const value = line.slice(idx + 1);
      const key = rawKey.split(";")[0].toUpperCase();
      switch (key) {
        case "UID": current.uid = value; break;
        case "DTSTART": current.dtstart = parseICalDate(value); break;
        case "DTEND": current.dtend = parseICalDate(value); break;
        case "SUMMARY": current.summary = value; break;
        case "DESCRIPTION": current.description = value; break;
      }
    }
  }
  return events;
}

// Convert parsed events into reservation records (idempotent via UID).
export function toReservations(events, propertyId) {
  return events.map((e) => ({
    externalId: e.uid,
    propertyId,
    checkIn: e.dtstart.toISOString(),
    checkOut: e.dtend.toISOString(),
    guestName: e.summary ?? "Guest",
  }));
}
