import { normalizeTags, canonicalRelationship, passesFilters, missingWarnings } from './tags.js';
import { countStats, splitChapters } from './wordcount.js';

console.log('tags:', normalizeTags(['지민', 'BTS Jimin', 'Romeo', '뷔']));
console.log('relationship:', canonicalRelationship('박지민/V'));
console.log('passes filter (block jimin):',
  passesFilters({ tags: ['지민', '학원물'] }, { blocked: ['jimin'] })
);
console.log('missing warnings:',
  missingWarnings({ tags: ['explicit', '학원물'], warnings: [] })
);

const md = `# 1화 만남

지민과 태형은 학교 옥상에서 처음 만났다. 그날 노을이 유난히 붉었다.

# 2화 다음 날

## 아침
다음 날 아침, 둘은 도서관에서 다시 마주쳤다.`;
console.log('stats:', countStats(md));
console.log('chapters:', splitChapters(md).map((c) => c.title));
