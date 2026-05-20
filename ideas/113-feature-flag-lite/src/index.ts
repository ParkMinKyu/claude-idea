// Example usage of the feature flag SDK.
import { FlagClient, type FlagDefinition } from './lib/engine';

const flags: FlagDefinition[] = [
  {
    key: 'new-checkout',
    enabled: true,
    defaultValue: false,
    rules: [
      { conditions: [{ attribute: 'plan', operator: 'eq', value: 'pro' }], serve: true },
      { conditions: [], rollout: 25, serve: true }, // 25% of everyone else
    ],
  },
];

const client = new FlagClient(flags);

const sample = ['u1', 'u2', 'u3', 'u4'];
for (const userId of sample) {
  const on = client.isEnabled('new-checkout', { userId, plan: 'free' });
  process.stdout.write(`${userId} (free): ${on}\n`);
}
process.stdout.write(`pro user: ${client.isEnabled('new-checkout', { userId: 'x', plan: 'pro' })}\n`);
