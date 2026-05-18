import { describe, it, expect } from 'vitest';
import { buildPodcastRss, formatDuration } from '../src/rss.js';

const baseChannel = {
  title: 'Test Pod',
  feedUrl: 'https://x.com/rss',
  ownerEmail: 'a@b.com',
  imageUrl: 'https://x.com/cover.jpg',
};

describe('formatDuration', () => {
  it('formats sub-hour as mm:ss', () => {
    expect(formatDuration(75)).toBe('01:15');
  });
  it('formats over-hour as hh:mm:ss', () => {
    expect(formatDuration(3661)).toBe('01:01:01');
  });
  it('handles zero / NaN safely', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(NaN)).toBe('00:00');
  });
});

describe('buildPodcastRss', () => {
  it('throws when required channel fields missing', () => {
    expect(() => buildPodcastRss({}, [])).toThrow();
  });

  it('includes iTunes owner + atom self link', () => {
    const xml = buildPodcastRss(baseChannel, []);
    expect(xml).toContain('itunes:owner');
    expect(xml).toContain('a@b.com');
    expect(xml).toContain('rel="self"');
  });

  it('renders enclosure with length + type for each episode', () => {
    const xml = buildPodcastRss(baseChannel, [
      {
        id: 'ep1',
        title: 'Hello & friends',
        audioUrl: 'https://x.com/ep1.mp3',
        audioLengthBytes: 1000,
        durationSeconds: 60,
      },
    ]);
    expect(xml).toContain('enclosure url="https://x.com/ep1.mp3" length="1000" type="audio/mpeg"');
    expect(xml).toContain('Hello &amp; friends');
    expect(xml).toContain('<itunes:duration>01:00</itunes:duration>');
  });

  it('skips episodes missing audioUrl or title', () => {
    const xml = buildPodcastRss(baseChannel, [
      { title: 'no audio' },
      { audioUrl: 'x.mp3' },
      { title: 'ok', audioUrl: 'https://x.com/y.mp3' },
    ]);
    expect((xml.match(/<item>/g) || []).length).toBe(1);
  });
});
