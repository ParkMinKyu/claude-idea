// Tiny CLI: preview what a non-subscriber would see for a sample issue.
import { renderForReader } from './paywall.js';

const sample = `# 오늘의 인사이트

첫 문단은 모두에게 공개됩니다. 여기서는 이번 주의 주요 트렌드를 한 줄로 정리합니다.

두 번째 문단은 트렌드의 배경을 설명합니다. 시장 데이터와 함께 짧게 정리합니다.

세 번째 문단은 유료 분석입니다. 구체 기업 사례와 숫자가 포함됩니다.

네 번째 문단은 액션 아이템과 추천 자료 링크입니다.`;

console.log('--- 비구독자 미리보기 (33%) ---');
console.log(renderForReader(sample, { isPaidMember: false, ratio: 0.33 }));
console.log('\n--- 유료 구독자 ---');
console.log(renderForReader(sample, { isPaidMember: true }));
