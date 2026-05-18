import { describe, it, expect } from 'vitest';
import { classifyMood, recommendTemplates } from '../src/match.js';

describe('classifyMood', () => {
  it('returns calm by default', () => {
    expect(classifyMood('')).toBe('calm');
    expect(classifyMood('something neutral')).toBe('calm');
  });

  it('picks inspire for challenge-themed text', () => {
    expect(classifyMood('도전을 두려워하지 말고 시작하라')).toBe('inspire');
  });

  it('picks love for love-themed text', () => {
    expect(classifyMood('너에게 고백할 사랑이 있다')).toBe('love');
  });

  it('picks sad for grief-themed text', () => {
    expect(classifyMood('이별의 눈물은 슬픔의 무게다')).toBe('sad');
  });
});

describe('recommendTemplates', () => {
  const templates = [
    { id: 'a', mood: 'calm' },
    { id: 'b', mood: 'inspire' },
    { id: 'c', mood: 'inspire' },
    { id: 'd', mood: 'love' },
  ];

  it('orders matching mood first', () => {
    const recs = recommendTemplates(templates, { text: '도전과 용기', count: 3 });
    expect(recs[0].mood).toBe('inspire');
    expect(recs[1].mood).toBe('inspire');
  });

  it('limits to requested count', () => {
    expect(recommendTemplates(templates, { text: 'x', count: 2 })).toHaveLength(2);
  });

  it('throws if templates not array', () => {
    expect(() => recommendTemplates(null, { text: 'x' })).toThrow();
  });
});
