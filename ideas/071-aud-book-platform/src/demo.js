import { distributeSubscriptionPool, singlePurchaseRoyalty } from './royalty.js';
import { watermarkSeed, watermarkPositions, formatChapterTime } from './watermark.js';

const payouts = distributeSubscriptionPool({
  poolKrw: 1_000_000,
  listens: [
    { bookId: 'b1', authorId: 'a1', seconds: 36_000 },
    { bookId: 'b2', authorId: 'a2', seconds: 12_000 },
    { bookId: 'b3', authorId: 'a1', seconds: 12_000 },
  ],
});
console.log('payouts:', Object.fromEntries(payouts));
console.log('single buy royalty (₩15,000, 25%):', singlePurchaseRoyalty({ priceKrw: 15000 }));

const seed = watermarkSeed('u_123', 'b_99');
console.log('seed:', seed);
console.log('positions:', watermarkPositions({ seed, durationSeconds: 1200, count: 5 }));
console.log('chapter time 3725.42s ->', formatChapterTime(3725.42));
