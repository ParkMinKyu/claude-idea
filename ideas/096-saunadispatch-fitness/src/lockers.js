// Locker state machine + rental/pass logic for SaunaDispatch.
// Pure functions so the same code runs on the server (Next.js route) and in tests.

export const LOCKER_STATES = Object.freeze({
  IDLE: "idle",
  IN_USE: "in_use",
  DIRTY: "dirty",
});

const VALID_TRANSITIONS = {
  idle: ["in_use"],
  in_use: ["dirty", "idle"],
  dirty: ["idle"],
};

export function transitionLocker(locker, nextState, { memberId, at = new Date() } = {}) {
  const allowed = VALID_TRANSITIONS[locker.state] ?? [];
  if (!allowed.includes(nextState)) {
    throw new Error(`invalid transition ${locker.state} -> ${nextState} for locker ${locker.id}`);
  }
  if (nextState === "in_use" && !memberId) {
    throw new Error("memberId required when assigning locker");
  }
  return {
    ...locker,
    state: nextState,
    memberId: nextState === "in_use" ? memberId : null,
    updatedAt: at.toISOString(),
  };
}

export function assignLocker(lockers, memberId, { preferred } = {}) {
  // Pick preferred if available, else first idle.
  if (preferred) {
    const target = lockers.find((l) => l.id === preferred);
    if (!target) throw new Error(`locker ${preferred} not found`);
    return transitionLocker(target, "in_use", { memberId });
  }
  const free = lockers.find((l) => l.state === "idle");
  if (!free) throw new Error("no idle lockers");
  return transitionLocker(free, "in_use", { memberId });
}

// Rental tracking — towels, gowns, slippers.
export function openRental(memberId, item, { at = new Date() } = {}) {
  return {
    id: `${memberId}-${item}-${at.getTime()}`,
    memberId,
    item,
    openedAt: at.toISOString(),
    returnedAt: null,
  };
}

export function closeRental(rental, { at = new Date() } = {}) {
  if (rental.returnedAt) throw new Error("rental already closed");
  return { ...rental, returnedAt: at.toISOString() };
}

export function outstandingRentals(rentals, memberId) {
  return rentals.filter((r) => r.memberId === memberId && !r.returnedAt);
}

// Pass deduction — season / count-based memberships.
export function consumePass(pass, { units = 1, at = new Date() } = {}) {
  if (pass.kind === "unlimited") {
    if (pass.expiresAt && new Date(pass.expiresAt) < at) {
      throw new Error("pass expired");
    }
    return pass;
  }
  if (pass.kind === "count") {
    if ((pass.remaining ?? 0) < units) {
      throw new Error("insufficient pass balance");
    }
    return { ...pass, remaining: pass.remaining - units };
  }
  throw new Error(`unknown pass kind ${pass.kind}`);
}

// Atomic check-in: assign locker, open towel rental, decrement pass.
export function checkin({ member, lockers, pass, rentals = [], item = "towel" }) {
  const updatedLocker = assignLocker(lockers, member.id);
  const updatedPass = consumePass(pass, { units: 1 });
  const rental = openRental(member.id, item);
  return {
    locker: updatedLocker,
    pass: updatedPass,
    rentals: [...rentals, rental],
  };
}

// Shift handover report.
export function shiftReport(lockers, rentals) {
  const dirty = lockers.filter((l) => l.state === "dirty").map((l) => l.id);
  const inUse = lockers.filter((l) => l.state === "in_use").map((l) => l.id);
  const unreturned = rentals.filter((r) => !r.returnedAt);
  return {
    dirtyCount: dirty.length,
    inUseCount: inUse.length,
    unreturnedCount: unreturned.length,
    dirty,
    inUse,
    unreturned,
  };
}
