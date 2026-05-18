// Event tickets MVP — capacity-tracked ticket types, HMAC-signed QR payloads,
// scan validation with duplicate-entry prevention.

import crypto from "node:crypto";

export function createEvent(store, def) {
  if (!def.id || !def.name) throw new Error("event id+name required");
  if (!Array.isArray(def.ticketTypes) || !def.ticketTypes.length) throw new Error("ticketTypes required");
  for (const tt of def.ticketTypes) {
    if (!tt.id || tt.priceCents == null || tt.capacity == null) {
      throw new Error("ticket type requires id, priceCents, capacity");
    }
    tt.sold = 0;
  }
  store.events.set(def.id, def);
  return def;
}

export function purchaseTicket(store, eventId, ticketTypeId, attendee) {
  const event = store.events.get(eventId);
  if (!event) throw new Error("event not found");
  const tt = event.ticketTypes.find((t) => t.id === ticketTypeId);
  if (!tt) throw new Error("ticket type not found");
  if (tt.sold >= tt.capacity) throw new Error("sold out");
  if (!attendee?.email) throw new Error("attendee.email required");
  tt.sold += 1;
  const ticketId = crypto.randomUUID();
  const ticket = {
    id: ticketId,
    eventId,
    ticketTypeId,
    attendee,
    issuedAt: new Date().toISOString(),
    scanned: false,
  };
  store.tickets.set(ticketId, ticket);
  return ticket;
}

// QR payload format: base64(JSON).hex(HMAC). Keeps the scanner offline-safe.
export function signTicketPayload(ticket, secret) {
  const body = Buffer.from(JSON.stringify({
    t: ticket.id,
    e: ticket.eventId,
    tt: ticket.ticketTypeId,
  })).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return `${body}.${sig}`;
}

export function verifyTicketPayload(payload, secret) {
  const [body, sig] = payload.split(".");
  if (!body || !sig) throw new Error("malformed payload");
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  if (
    expected.length !== sig.length ||
    !crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(sig, "hex"))
  ) {
    throw new Error("invalid signature");
  }
  const json = JSON.parse(Buffer.from(body, "base64url").toString());
  return { ticketId: json.t, eventId: json.e, ticketTypeId: json.tt };
}

export function scanTicket(store, payload, secret, eventId) {
  let claim;
  try {
    claim = verifyTicketPayload(payload, secret);
  } catch (err) {
    return { ok: false, reason: "invalid_signature" };
  }
  if (claim.eventId !== eventId) return { ok: false, reason: "wrong_event" };
  const ticket = store.tickets.get(claim.ticketId);
  if (!ticket) return { ok: false, reason: "not_found" };
  if (ticket.scanned) return { ok: false, reason: "already_scanned", scannedAt: ticket.scannedAt };
  ticket.scanned = true;
  ticket.scannedAt = new Date().toISOString();
  return { ok: true, ticket };
}

export function eventStats(store, eventId) {
  const event = store.events.get(eventId);
  if (!event) throw new Error("event not found");
  const issued = [...store.tickets.values()].filter((t) => t.eventId === eventId);
  const scanned = issued.filter((t) => t.scanned).length;
  const byType = {};
  for (const tt of event.ticketTypes) {
    byType[tt.id] = {
      sold: tt.sold,
      capacity: tt.capacity,
      remaining: tt.capacity - tt.sold,
      revenueCents: tt.sold * tt.priceCents,
    };
  }
  return { eventId, issued: issued.length, scanned, scanRate: issued.length ? scanned / issued.length : 0, byType };
}

export function createStore() {
  return { events: new Map(), tickets: new Map() };
}
