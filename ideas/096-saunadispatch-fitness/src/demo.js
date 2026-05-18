// Demo runner — shows a complete check-in → check-out flow for one member.
import { checkin, closeRental, transitionLocker, shiftReport } from "./lockers.js";

const lockers = Array.from({ length: 5 }, (_, i) => ({
  id: `L${i + 1}`,
  state: "idle",
  memberId: null,
}));

const pass = { id: "P-1", kind: "count", remaining: 10 };
const member = { id: "M-42", name: "김민지" };

const after = checkin({ member, lockers, pass });
console.log("after checkin:", after);

const returned = closeRental(after.rentals[0]);
const dirty = transitionLocker(after.locker, "dirty");
console.log("after checkout:", { returned, dirty });

console.log("shift report:", shiftReport([dirty, ...lockers.slice(1)], [returned]));
