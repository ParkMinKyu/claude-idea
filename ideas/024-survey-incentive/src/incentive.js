// Incentive survey core: reward pool, quality score, payout routing.

export function chargePool(pool, amount) {
  if (amount <= 0) throw new Error("amount must be > 0");
  if (amount > pool.balance) throw new Error("insufficient pool balance");
  return { ...pool, balance: pool.balance - amount, spent: (pool.spent ?? 0) + amount };
}

export function topUpPool(pool, amount, fee = 0) {
  if (amount <= 0) throw new Error("amount must be > 0");
  return {
    ...pool,
    balance: pool.balance + amount,
    topUps: [...(pool.topUps ?? []), { amount, fee, at: new Date().toISOString() }],
  };
}

// Quality heuristics for a single response.
// answers: [{ qid, value, msSpent }]
// median time per question fed as `expectedPerQuestion`.
export function qualityScore(response, expectedPerQuestion = 8000) {
  const answers = response.answers ?? [];
  if (answers.length === 0) return 0;
  let score = 100;

  const total = answers.reduce((s, a) => s + (a.msSpent ?? 0), 0);
  const tooFast = total < answers.length * (expectedPerQuestion / 4);
  if (tooFast) score -= 40;

  // Straightlining: same value across >=4 likert-style answers
  const numericValues = answers.map((a) => a.value).filter((v) => typeof v === "number" || /^\d+$/.test(String(v)));
  if (numericValues.length >= 4 && new Set(numericValues).size === 1) score -= 30;

  // Empty/short open answers
  const open = answers.filter((a) => typeof a.value === "string" && a.value.length > 0);
  const tooShort = open.filter((a) => a.value.trim().length < 3);
  if (open.length > 0 && tooShort.length / open.length > 0.5) score -= 20;

  // Honeypot
  if (response.honeypot) score = 0;

  return Math.max(0, Math.min(100, score));
}

// Reward tiers based on quality. Returns amount in minor units (KRW).
export function rewardFor(qualityScore, baseAmount) {
  if (qualityScore < 40) return 0;
  if (qualityScore < 70) return Math.floor(baseAmount * 0.5);
  return baseAmount;
}

// Routes payout to channel — small amounts go to kakaotalk gifticon, larger to bank.
export function pickPayoutChannel(amountKrw) {
  if (amountKrw <= 0) return "none";
  if (amountKrw < 5_000) return "kakao_gifticon";
  return "bank_transfer";
}

export function settleResponse(pool, response, baseAmount) {
  const quality = qualityScore(response);
  const reward = rewardFor(quality, baseAmount);
  if (reward === 0) return { pool, payout: null, quality };
  const platformFee = Math.ceil(reward * 0.15);
  const totalDebit = reward + platformFee;
  const nextPool = chargePool(pool, totalDebit);
  return {
    pool: nextPool,
    payout: {
      respondentId: response.respondentId,
      amount: reward,
      fee: platformFee,
      channel: pickPayoutChannel(reward),
      at: new Date().toISOString(),
    },
    quality,
  };
}
