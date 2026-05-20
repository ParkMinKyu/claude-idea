// Example: assign visitors and analyze a result.
import { ExperimentClient } from './lib/assign';
import { analyze } from './lib/stats';

const client = new ExperimentClient([
  { key: 'cta-color', variants: [{ key: 'control', weight: 1 }, { key: 'treatment', weight: 1 }] },
]);

for (const u of ['u1', 'u2', 'u3', 'u4']) {
  process.stdout.write(`${u} -> ${client.getVariant('cta-color', u)}\n`);
}

const result = analyze(
  { conversions: 120, visitors: 1000 },
  { conversions: 150, visitors: 1000 },
);
process.stdout.write(
  `uplift=${(result.relativeUplift * 100).toFixed(1)}% p=${result.pValue.toFixed(4)} sig=${result.significant}\n`,
);
