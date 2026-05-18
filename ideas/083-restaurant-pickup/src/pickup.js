// Restaurant pickup ordering MVP — menu pricing with options,
// order state machine, ETA computation, SMS template builder.

export const ORDER_STATES = {
  PENDING_PAYMENT: "pending_payment",
  PAID: "paid",
  PREPARING: "preparing",
  READY: "ready",
  PICKED_UP: "picked_up",
  CANCELED: "canceled",
};

export function computeItemPrice(item, selectedOptionIds = []) {
  let total = item.basePriceCents;
  const selected = new Set(selectedOptionIds);
  for (const group of item.optionGroups ?? []) {
    let pickedInGroup = 0;
    for (const opt of group.options) {
      if (selected.has(opt.id)) {
        total += opt.deltaCents ?? 0;
        pickedInGroup += 1;
      }
    }
    if (group.required && pickedInGroup === 0) {
      throw new Error(`required group ${group.name} not selected`);
    }
    if (group.max != null && pickedInGroup > group.max) {
      throw new Error(`group ${group.name} exceeds max ${group.max}`);
    }
  }
  return total;
}

export function computeOrderTotal(menu, orderLines) {
  let subtotal = 0;
  const lines = [];
  for (const line of orderLines) {
    const item = menu.find((i) => i.id === line.itemId);
    if (!item) throw new Error(`unknown item ${line.itemId}`);
    if (item.soldOut) throw new Error(`sold out: ${item.id}`);
    const unit = computeItemPrice(item, line.optionIds);
    const qty = line.quantity ?? 1;
    subtotal += unit * qty;
    lines.push({ itemId: item.id, name: item.name, unit, qty, lineTotal: unit * qty });
  }
  return { subtotal, lines };
}

export function transitionOrder(currentState, action) {
  const map = {
    [ORDER_STATES.PENDING_PAYMENT]: { paid: ORDER_STATES.PAID, cancel: ORDER_STATES.CANCELED },
    [ORDER_STATES.PAID]: { start: ORDER_STATES.PREPARING, cancel: ORDER_STATES.CANCELED },
    [ORDER_STATES.PREPARING]: { ready: ORDER_STATES.READY, cancel: ORDER_STATES.CANCELED },
    [ORDER_STATES.READY]: { pickup: ORDER_STATES.PICKED_UP },
  };
  const next = map[currentState]?.[action];
  if (!next) throw new Error(`bad transition ${currentState} --${action}-->`);
  return next;
}

// Suggest pickup ETA based on queue depth and average prep time per item.
export function estimateEtaMinutes(queueOrders, prepMinutesPerItem = 3, baseMinutes = 5) {
  const inflight = queueOrders.filter((o) =>
    o.state === ORDER_STATES.PREPARING || o.state === ORDER_STATES.PAID
  );
  const totalItems = inflight.reduce(
    (n, o) => n + o.lines.reduce((a, l) => a + l.qty, 0),
    0
  );
  return baseMinutes + totalItems * prepMinutesPerItem;
}

export function buildReadySms(order, store) {
  const itemSummary = order.lines.map((l) => `${l.name}×${l.qty}`).join(", ");
  return [
    `[${store.name}] 주문이 준비되었습니다!`,
    `주문번호: ${order.shortCode}`,
    `메뉴: ${itemSummary}`,
    store.address ? `픽업: ${store.address}` : "",
  ].filter(Boolean).join("\n");
}

export function nextShortCode(prevCode) {
  // Rolling 4-digit code per store; wraps at 9999.
  if (!prevCode) return "0001";
  const n = (parseInt(prevCode, 10) + 1) % 10_000;
  return n.toString().padStart(4, "0");
}
