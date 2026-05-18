import { openTruck, closeTruck, trucksNearby, deriveState, followersToNotify, buildOgPayload } from "./locator.js";

const seoul = { lat: 37.5665, lng: 126.978 };
let truck = { id: "T-1", name: "오늘의 타코" };
truck = openTruck(truck, {
  location: { ...seoul, address: "서울시 중구 명동" },
  openSince: new Date("2026-05-18T03:00:00Z"),
  openUntil: new Date("2026-05-18T08:00:00Z"),
  menuId: "M-1",
});
console.log("truck opened:", truck);
console.log("state at 04:00:", deriveState(truck, new Date("2026-05-18T04:00:00Z")));
console.log("state at 07:58:", deriveState(truck, new Date("2026-05-18T07:58:00Z")));

const followers = [
  { id: "F1", truckId: "T-1", muted: false, utcOffsetHours: 9 },
  { id: "F2", truckId: "T-1", muted: true, utcOffsetHours: 9 },
  { id: "F3", truckId: "T-2", muted: false, utcOffsetHours: 9 },
];
const targets = followersToNotify({ truck, followers, now: new Date("2026-05-18T03:00:00Z") });
console.log("notify targets:", targets);

const trucks = [
  truck,
  openTruck({ id: "T-2", name: "와플하우스" }, {
    location: { lat: 37.57, lng: 126.99, address: "종로구" },
    openUntil: new Date("2026-05-18T08:00:00Z"),
    openSince: new Date("2026-05-18T03:00:00Z"),
  }),
];
console.log("nearby 2km:", trucksNearby(trucks, seoul, 2000).map((x) => ({ name: x.truck.name, m: Math.round(x.distanceM) })));

const og = buildOgPayload(truck, { items: [{ name: "쇠고기 타코", priceCents: 5000 }, { name: "치킨 타코", priceCents: 4500 }] });
console.log("og:", og);

const closed = closeTruck(truck);
console.log("closed state:", deriveState(closed));
