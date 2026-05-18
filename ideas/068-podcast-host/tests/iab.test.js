import { describe, it, expect } from 'vitest';
import { isBotUserAgent, ipPrefix, countIabDownloads } from '../src/iab.js';

describe('isBotUserAgent', () => {
  it('flags known bots', () => {
    expect(isBotUserAgent('Googlebot/2.1')).toBe(true);
    expect(isBotUserAgent('facebookexternalhit/1.1')).toBe(true);
    expect(isBotUserAgent('Mozilla/5.0 Slackbot-LinkExpanding 1.0')).toBe(true);
  });
  it('passes through real podcast clients', () => {
    expect(isBotUserAgent('AppleCoreMedia/1.0.0.20G75 (iPhone; U; CPU OS 16_6)')).toBe(false);
    expect(isBotUserAgent('Overcast/2023.4 (+http://overcast.fm/)')).toBe(false);
  });
  it('treats empty UA as bot', () => {
    expect(isBotUserAgent('')).toBe(true);
    expect(isBotUserAgent(null)).toBe(true);
  });
});

describe('ipPrefix', () => {
  it('crops IPv4 to /24', () => {
    expect(ipPrefix('192.168.1.42')).toBe('192.168.1.0/24');
  });
  it('crops IPv6 to /48', () => {
    expect(ipPrefix('2001:0db8:85a3:1::1')).toBe('2001:0db8:85a3::/48');
  });
});

describe('countIabDownloads', () => {
  const ua = 'AppleCoreMedia/1.0.0';
  it('dedupes same /24 + ua within 24h', () => {
    const events = [
      { ts: '2026-05-18T10:00:00Z', episodeId: 'ep1', ip: '1.2.3.4', ua, bytes: 2_000_000 },
      { ts: '2026-05-18T15:00:00Z', episodeId: 'ep1', ip: '1.2.3.99', ua, bytes: 2_000_000 },
    ];
    expect(countIabDownloads(events)).toBe(1);
  });

  it('counts again after 24h window', () => {
    const events = [
      { ts: '2026-05-18T10:00:00Z', episodeId: 'ep1', ip: '1.2.3.4', ua, bytes: 2_000_000 },
      { ts: '2026-05-19T11:00:00Z', episodeId: 'ep1', ip: '1.2.3.4', ua, bytes: 2_000_000 },
    ];
    expect(countIabDownloads(events)).toBe(2);
  });

  it('rejects bots and tiny chunks', () => {
    const events = [
      { ts: '2026-05-18T10:00:00Z', episodeId: 'ep1', ip: '1.2.3.4', ua: 'Googlebot', bytes: 2_000_000 },
      { ts: '2026-05-18T10:01:00Z', episodeId: 'ep1', ip: '2.2.2.2', ua, bytes: 1000, secondsPlayed: 0 },
    ];
    expect(countIabDownloads(events)).toBe(0);
  });
});
