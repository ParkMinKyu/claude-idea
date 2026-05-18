import { parseFeed } from './rss.js';
import { dedupe, buildSummaryPrompt } from './summarize.js';

const xml = `<?xml version="1.0"?>
<rss><channel>
  <item>
    <title>스타트업 A, 시리즈 B 200억 투자 유치</title>
    <link>https://news.example.com/a?utm_source=rss</link>
    <description>스타트업 A가 시리즈 B 라운드를 마감했다.</description>
    <pubDate>Mon, 18 May 2026 09:00:00 +0900</pubDate>
  </item>
  <item>
    <title>스타트업 A 시리즈B 마감 200억</title>
    <link>https://news.example.com/a</link>
    <description>중복 기사</description>
    <pubDate>Mon, 18 May 2026 09:30:00 +0900</pubDate>
  </item>
</channel></rss>`;

const items = parseFeed(xml);
const unique = dedupe(items);
console.log('parsed:', items.length, 'unique:', unique.length);
console.log('prompt:\n' + buildSummaryPrompt({ ...unique[0], category: '스타트업' }));
