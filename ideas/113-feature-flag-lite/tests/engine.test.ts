import { describe, it, expect } from 'vitest';
import {
  evaluate, bucket, FlagClient, type FlagDefinition,
} from '../src/lib/engine';

const proFlag: FlagDefinition = {
  key: 'new-checkout',
  enabled: true,
  defaultValue: false,
  rules: [
    { conditions: [{ attribute: 'plan', operator: 'eq', value: 'pro' }], serve: true },
  ],
};

describe('evaluate', () => {
  it('returns default with reason disabled when master switch off', () => {
    const r = evaluate({ ...proFlag, enabled: false }, { plan: 'pro' });
    expect(r).toMatchObject({ value: false, reason: 'disabled' });
  });

  it('serves a variant when a rule matches', () => {
    const r = evaluate(proFlag, { plan: 'pro' });
    expect(r).toMatchObject({ value: true, reason: 'rule_match', ruleIndex: 0 });
  });

  it('falls through to default when no rule matches', () => {
    const r = evaluate(proFlag, { plan: 'free' });
    expect(r).toMatchObject({ value: false, reason: 'default' });
  });

  it('supports numeric and array operators', () => {
    const flag: FlagDefinition = {
      key: 'beta', enabled: true, defaultValue: false,
      rules: [{
        conditions: [
          { attribute: 'age', operator: 'gte', value: 18 },
          { attribute: 'country', operator: 'in', value: ['KR', 'US'] },
        ],
        serve: true,
      }],
    };
    expect(evaluate(flag, { age: 20, country: 'KR' }).value).toBe(true);
    expect(evaluate(flag, { age: 16, country: 'KR' }).value).toBe(false);
    expect(evaluate(flag, { age: 20, country: 'JP' }).value).toBe(false);
  });
});

describe('bucket', () => {
  it('is deterministic for the same key+user', () => {
    expect(bucket('f', 'user-1')).toBe(bucket('f', 'user-1'));
  });

  it('returns values in 0..99', () => {
    for (const u of ['a', 'b', 'c', 'd', 'e']) {
      const b = bucket('flag', u);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThan(100);
    }
  });

  it('produces a roughly uniform distribution', () => {
    let inFirstHalf = 0;
    const N = 2000;
    for (let i = 0; i < N; i += 1) if (bucket('flag', `user-${i}`) < 50) inFirstHalf += 1;
    const ratio = inFirstHalf / N;
    expect(ratio).toBeGreaterThan(0.4);
    expect(ratio).toBeLessThan(0.6);
  });
});

describe('rollout', () => {
  it('a 0% rollout never serves and 100% always serves for matching users', () => {
    const mk = (rollout: number): FlagDefinition => ({
      key: 'r', enabled: true, defaultValue: false,
      rules: [{ conditions: [], rollout, serve: true }],
    });
    const off = evaluate(mk(0), { userId: 'any' });
    expect(off.reason).toBe('rollout_excluded');
    expect(evaluate(mk(100), { userId: 'any' }).value).toBe(true);
  });
});

describe('FlagClient', () => {
  it('isEnabled and variant work; unknown flags are false', () => {
    const c = new FlagClient([proFlag]);
    expect(c.isEnabled('new-checkout', { plan: 'pro' })).toBe(true);
    expect(c.isEnabled('new-checkout', { plan: 'free' })).toBe(false);
    expect(c.isEnabled('does-not-exist')).toBe(false);
  });
});
