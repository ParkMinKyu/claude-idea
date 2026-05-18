// TruckPin core — distance math, open-state machine, follower notify targeting.

const R_EARTH_M = 6_371_000;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

// Great-circle distance in meters between two lat/lng points.
export function haversineMeters(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R_EARTH_M * Math.asin(Math.sqrt(x));
}

// Filter trucks within radius (meters).
export function trucksNearby(trucks, origin, radiusMeters) {
  return trucks
    .filter((t) => t.location)
    .map((t) => ({ truck: t, distanceM: haversineMeters(origin, t.location) }))
    .filter((x) => x.distanceM <= radiusMeters)
    .sort((a, b) => a.distanceM - b.distanceM);
}

// Open-state machine.
export const TRUCK_STATES = Object.freeze({
  CLOSED: "closed",
  OPEN: "open",
  ENDING_SOON: "ending_soon",
});

export function deriveState(truck, now = new Date()) {
  if (!truck.openUntil || !truck.openSince) return "closed";
  const since = new Date(truck.openSince);
  const until = new Date(truck.openUntil);
  if (now < since || now > until) return "closed";
  const remainingMs = until - now;
  if (remainingMs <= 5 * 60_000) return "ending_soon";
  return "open";
}

// Toggle truck open/close.
export function openTruck(truck, { location, openSince = new Date(), openUntil, menuId }) {
  if (!location || typeof location.lat !== "number" || typeof location.lng !== "number") {
    throw new Error("location {lat,lng} required");
  }
  if (!openUntil || new Date(openUntil) <= openSince) {
    throw new Error("openUntil must be after openSince");
  }
  return {
    ...truck,
    location,
    openSince: openSince.toISOString(),
    openUntil: new Date(openUntil).toISOString(),
    activeMenuId: menuId ?? truck.activeMenuId,
  };
}

export function closeTruck(truck) {
  return { ...truck, openSince: null, openUntil: null };
}

// Pick which followers to notify when a truck opens.
// - Skip muted followers.
// - Apply per-follower max notifications per day.
// - Respect quiet hours (22:00-08:00 local UTC offset hours).
export function followersToNotify({ truck, followers, recentNotifications = [], now = new Date() }) {
  const hourUTC = now.getUTCHours();
  const sentToday = new Map();
  for (const n of recentNotifications) {
    if (new Date(n.sentAt).toISOString().slice(0, 10) !== now.toISOString().slice(0, 10)) continue;
    sentToday.set(n.followerId, (sentToday.get(n.followerId) ?? 0) + 1);
  }
  return followers.filter((f) => {
    if (f.muted) return false;
    if (f.truckId !== truck.id) return false;
    const localHour = (hourUTC + (f.utcOffsetHours ?? 9)) % 24;
    if (localHour >= 22 || localHour < 8) return false;
    if ((sentToday.get(f.id) ?? 0) >= (f.dailyCap ?? 3)) return false;
    return true;
  });
}

// OG image data — passed into next/og or similar.
export function buildOgPayload(truck, menu) {
  return {
    title: `${truck.name} · ${truck.location ? "지금 영업 중" : "오늘 휴무"}`,
    subtitle: truck.location
      ? `${truck.location.address ?? "현재 위치"} · ${truck.openUntil ? `~${new Date(truck.openUntil).toISOString().slice(11, 16)} UTC` : ""}`
      : "다음 영업을 기다려주세요",
    items: (menu?.items ?? []).slice(0, 4).map((i) => ({ name: i.name, price: i.priceCents })),
  };
}
