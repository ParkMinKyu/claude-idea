import {
  buildCheckoutSession,
  reserveMachine,
  handlePaymentSucceeded,
  rollupRevenue,
} from "./pos.js";

const machine = {
  id: "M-101",
  label: "세탁기 #1",
  currency: "krw",
  pricing: { wash: 4000, dry: 3000 },
};

const reservation = reserveMachine({ reservations: [], machineId: machine.id, userId: "U1" });
console.log("reservation:", reservation);

const session = buildCheckoutSession({
  machine,
  cycle: "wash",
  userId: "U1",
  successUrl: "https://washkey.app/success",
  cancelUrl: "https://washkey.app/cancel",
});
console.log("checkout session:", session);

const unlockAdapter = {
  async unlock(m, ctx) {
    console.log("unlocking", m.id, "for", ctx);
  },
};

const event = {
  type: "checkout.session.completed",
  data: {
    object: {
      id: "cs_test_123",
      amount_total: 4000,
      metadata: { machineId: machine.id, cycle: "wash", userId: "U1" },
    },
  },
};

const { transaction } = await handlePaymentSucceeded({ event, machinesById: { [machine.id]: machine }, unlockAdapter });
console.log("tx:", transaction);

console.log("daily rollup:", rollupRevenue([transaction]));
