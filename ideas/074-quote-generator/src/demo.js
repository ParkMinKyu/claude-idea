import { classifyMood, recommendTemplates } from './match.js';
import { templatePackPayout, podBreakdown } from './pricing.js';

const templates = [
  { id: 't1', mood: 'calm', palette: 'beige' },
  { id: 't2', mood: 'inspire', palette: 'sunrise' },
  { id: 't3', mood: 'love', palette: 'rose' },
  { id: 't4', mood: 'calm', palette: 'ocean' },
];

console.log('mood:', classifyMood('새벽 바다의 고요함처럼 마음을 비우세요.'));
console.log('templates:', recommendTemplates(templates, { text: '도전 앞에서 용기를 내자', count: 3 }).map((t) => t.id));
console.log('pack payout (₩4,900):', templatePackPayout({ priceKrw: 4900 }));
console.log('poster:', podBreakdown({ productType: 'poster', marginRatio: 0.2 }));
