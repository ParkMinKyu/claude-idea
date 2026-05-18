import { recommend, jaccard } from './recommend.js';
import { buildAffiliateLink } from './affiliate.js';

const works = [
  { id: 'w1', title: '회귀한 마탑주', tags: ['판타지', '회귀', '먼치킨'] },
  { id: 'w2', title: '직장인 일상툰', tags: ['일상', '코미디'] },
  { id: 'w3', title: '회귀자의 마법은 특별해야 합니다', tags: ['판타지', '회귀', '학원'] },
  { id: 'w4', title: '오피스 로맨스', tags: ['로맨스', '직장'] },
];
const ratings = [
  { workId: 'w1', score: 5 },
  { workId: 'w2', score: 2 },
];

console.log('jaccard w1<->w3:', jaccard(works[0].tags, works[2].tags));
console.log('recommendations:');
for (const r of recommend({ ratings, works, limit: 3 })) {
  console.log(`  ${r.work.title} -> ${r.score.toFixed(2)}`);
}

console.log('affiliate link:', buildAffiliateLink({ platform: 'naver', externalId: '12345', userId: 'u_001' }));
