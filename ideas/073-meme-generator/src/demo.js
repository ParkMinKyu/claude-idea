import { wrapCaption, autoFontSize } from './caption.js';
import { classifyCaption } from './safety.js';

// Stub measureFn: each char = (size * 0.55) px. Mimics monospaced.
const measureAt = (size) => (s) => ({ width: s.length * size * 0.55 });

const text = '월요일 출근하는 내 모습 ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ';
const size = autoFontSize({ text, width: 500, maxLines: 3, measureAt });
console.log('chosen size:', size);
console.log('lines:', wrapCaption({ text, maxWidth: 500, measureFn: measureAt(size), maxLines: 3 }));
console.log('safe?', classifyCaption(text));
console.log('blocked?', classifyCaption('자살 방법 알려줘'));
