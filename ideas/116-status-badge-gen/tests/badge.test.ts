import { describe, it, expect } from 'vitest';
import { renderBadge, resolveColor, textWidth, coverageBadge } from '../src/lib/badge';

describe('resolveColor', () => {
  it('maps named colors to hex', () => {
    expect(resolveColor('brightgreen')).toBe('#4c1');
    expect(resolveColor('red')).toBe('#e05d44');
  });
  it('passes through hex colors', () => {
    expect(resolveColor('#abc')).toBe('#abc');
    expect(resolveColor('#123456')).toBe('#123456');
  });
  it('falls back for unknown names', () => {
    expect(resolveColor('notacolor')).toBe('#9f9f9f');
  });
});

describe('textWidth', () => {
  it('is monotonic with string length', () => {
    expect(textWidth('aa')).toBeGreaterThan(textWidth('a'));
  });
  it('returns 0 for empty string', () => {
    expect(textWidth('')).toBe(0);
  });
});

describe('renderBadge', () => {
  it('produces valid svg with both texts', () => {
    const svg = renderBadge({ label: 'build', message: 'passing', color: 'brightgreen' });
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('</svg>');
    expect(svg).toContain('>build<');
    expect(svg).toContain('>passing<');
    expect(svg).toContain('#4c1'); // resolved color
  });

  it('escapes xml-special characters', () => {
    const svg = renderBadge({ label: 'a<b>', message: 'x&y"z' });
    expect(svg).toContain('a&lt;b&gt;');
    expect(svg).toContain('x&amp;y&quot;z');
    expect(svg).not.toContain('a<b>');
  });

  it('width grows with longer messages', () => {
    const short = renderBadge({ label: 'v', message: '1' });
    const long = renderBadge({ label: 'v', message: '1.0.0-rc.1' });
    const wShort = Number(/width="(\d+)"/.exec(short)![1]);
    const wLong = Number(/width="(\d+)"/.exec(long)![1]);
    expect(wLong).toBeGreaterThan(wShort);
  });

  it('has accessible aria-label', () => {
    const svg = renderBadge({ label: 'tests', message: 'ok' });
    expect(svg).toContain('aria-label="tests: ok"');
  });
});

describe('coverageBadge', () => {
  it('picks color by threshold', () => {
    expect(coverageBadge(95)).toContain('#4c1'); // brightgreen
    expect(coverageBadge(80)).toContain('#97ca00'); // green
    expect(coverageBadge(30)).toContain('#e05d44'); // red
  });
  it('shows the percentage as the message', () => {
    expect(coverageBadge(73)).toContain('>73%<');
  });
});
