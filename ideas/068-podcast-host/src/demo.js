import { buildPodcastRss } from './rss.js';
import { countIabDownloads } from './iab.js';

const rss = buildPodcastRss(
  {
    title: '인디 개발자 잡담',
    feedUrl: 'https://example.com/p/indie/rss',
    siteUrl: 'https://example.com/p/indie',
    ownerEmail: 'host@example.com',
    description: '주 1회 인디 개발자 이야기',
    imageUrl: 'https://example.com/cover.jpg',
    category: 'Technology',
    language: 'ko-kr',
  },
  [
    {
      id: 'ep1',
      title: '1화: 시작합니다',
      description: '왜 팟캐스트를?',
      audioUrl: 'https://cdn.example.com/ep1.mp3',
      audioLengthBytes: 12345678,
      durationSeconds: 1830,
      publishedAt: '2026-05-18T00:00:00Z',
    },
  ],
);
console.log(rss.split('\n').slice(0, 12).join('\n'));

const dl = countIabDownloads([
  { ts: '2026-05-18T10:00:00Z', episodeId: 'ep1', ip: '1.2.3.4', ua: 'AppleCoreMedia/1.0.0', bytes: 2000000, secondsPlayed: 0 },
  { ts: '2026-05-18T11:00:00Z', episodeId: 'ep1', ip: '1.2.3.5', ua: 'AppleCoreMedia/1.0.0', bytes: 2000000, secondsPlayed: 0 }, // same /24
  { ts: '2026-05-18T12:00:00Z', episodeId: 'ep1', ip: '8.8.8.8', ua: 'Googlebot/2.1', bytes: 2000000, secondsPlayed: 0 }, // bot
  { ts: '2026-05-19T11:00:01Z', episodeId: 'ep1', ip: '1.2.3.4', ua: 'AppleCoreMedia/1.0.0', bytes: 2000000, secondsPlayed: 0 }, // > 24h
]);
console.log('iab downloads:', dl);
