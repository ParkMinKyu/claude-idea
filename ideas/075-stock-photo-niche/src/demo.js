import { canIssueLicense, photoPayout, priceForTier } from './license.js';
import { rank } from './search.js';

console.log('standard price:', priceForTier('standard'));

const release = { allowsCommercial: true, allowsPolitical: false, allowsAdult: false, allowsResale: false };
console.log('commercial OK?', canIssueLicense({ tier: 'commercial', modelRelease: release, use: { ooh: true } }));
console.log('political blocked?', canIssueLicense({ tier: 'commercial', modelRelease: release, use: { political: true } }));

console.log('payout:', photoPayout({ saleKrw: 29000 }));

const photos = [
  { id: 'p1', title: '한복 입은 직장인', tags: ['한복', '직장인', '여성'], embedding: [1, 0, 0] },
  { id: 'p2', title: '전통시장', tags: ['전통', '시장', '풍경'], embedding: [0, 1, 0] },
];
console.log('rank:', rank({ query: '한복 여성', photos }).map((r) => `${r.photo.id}=${r.score.toFixed(2)}`));
