// WashKey POS domain — pricing, reservations, payment-to-unlock flow.

const MIN = 60_000;

export function priceForCycle(machine, cycle) {
  const base = machine.pricing[cycle];
  if (typeof base !== "number") throw new Error(`unknown cycle ${cycle} for ${machine.id}`);
  return base;
}

// Reservation TTL = 5 minutes by default; expires automatically.
export function makeReservation({ machineId, userId, now = new Date(), ttlMinutes = 5 }) {
  return {
    id: `R-${machineId}-${now.getTime()}`,
    machineId,
    userId,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ttlMinutes * MIN).toISOString(),
    status: "active",
  };
}

export function isReservationExpired(reservation, now = new Date()) {
  return new Date(reservation.expiresAt) <= now;
}

export function findActiveReservation(reservations, machineId, now = new Date()) {
  return reservations.find(
    (r) => r.machineId === machineId && r.status === "active" && !isReservationExpired(r, now)
  );
}

export function reserveMachine({ reservations, machineId, userId, now = new Date() }) {
  const active = findActiveReservation(reservations, machineId, now);
  if (active && active.userId !== userId) {
    throw new Error("machine already reserved");
  }
  if (active && active.userId === userId) return active;
  return makeReservation({ machineId, userId, now });
}

// Compute Stripe Checkout session input (pure function — returned object is fed to stripe SDK).
export function buildCheckoutSession({ machine, cycle, userId, successUrl, cancelUrl }) {
  const amount = priceForCycle(machine, cycle);
  return {
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: machine.currency ?? "krw",
          product_data: { name: `${machine.label} - ${cycle}` },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    metadata: { machineId: machine.id, cycle, userId },
    success_url: successUrl,
    cancel_url: cancelUrl,
  };
}

// Webhook handler: given a verified Stripe event, build a transaction + unlock command.
export async function handlePaymentSucceeded({ event, machinesById, unlockAdapter }) {
  if (event.type !== "checkout.session.completed") return { ignored: true };
  const session = event.data.object;
  const { machineId, cycle, userId } = session.metadata ?? {};
  const machine = machinesById[machineId];
  if (!machine) throw new Error(`unknown machine ${machineId}`);

  const tx = {
    id: `TX-${session.id}`,
    machineId,
    userId,
    cycle,
    amountCents: session.amount_total,
    paidAt: new Date().toISOString(),
    unlockStatus: "pending",
  };

  try {
    await unlockAdapter.unlock(machine, { cycle, transactionId: tx.id });
    tx.unlockStatus = "ok";
  } catch (err) {
    tx.unlockStatus = "failed";
    tx.unlockError = err.message;
  }
  return { transaction: tx };
}

// Daily revenue rollup for the merchant dashboard.
export function rollupRevenue(transactions, { from, to } = {}) {
  const start = from ? new Date(from).getTime() : 0;
  const end = to ? new Date(to).getTime() : Date.now();
  const filtered = transactions.filter((t) => {
    const at = new Date(t.paidAt).getTime();
    return at >= start && at <= end && t.unlockStatus === "ok";
  });
  const totalCents = filtered.reduce((s, t) => s + t.amountCents, 0);
  const byMachine = {};
  for (const t of filtered) {
    byMachine[t.machineId] = (byMachine[t.machineId] ?? 0) + t.amountCents;
  }
  return { totalCents, count: filtered.length, byMachine };
}
