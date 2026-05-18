// Build an iTunes / Spotify-compliant podcast RSS feed.
// Reference: Apple Podcasts Connect "RSS feed requirements".

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cdata(s) {
  return `<![CDATA[${String(s ?? '').replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

export function buildPodcastRss(channel, episodes) {
  if (!channel?.title || !channel?.feedUrl || !channel?.ownerEmail) {
    throw new Error('channel.title, feedUrl, ownerEmail are required');
  }
  if (!Array.isArray(episodes)) throw new TypeError('episodes must be array');

  const items = episodes
    .filter((e) => e.audioUrl && e.title)
    .map((e) => {
      const len = Number(e.audioLengthBytes) || 0;
      const dur = formatDuration(e.durationSeconds);
      const pub = new Date(e.publishedAt || Date.now()).toUTCString();
      return `    <item>
      <title>${esc(e.title)}</title>
      <description>${cdata(e.description || '')}</description>
      <pubDate>${pub}</pubDate>
      <enclosure url="${esc(e.audioUrl)}" length="${len}" type="audio/mpeg"/>
      <guid isPermaLink="false">${esc(e.id || e.audioUrl)}</guid>
      <itunes:duration>${dur}</itunes:duration>
      <itunes:explicit>${e.explicit ? 'true' : 'false'}</itunes:explicit>${
        e.episodeNumber
          ? `\n      <itunes:episode>${Number(e.episodeNumber)}</itunes:episode>`
          : ''
      }
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${esc(channel.title)}</title>
    <link>${esc(channel.siteUrl || channel.feedUrl)}</link>
    <language>${esc(channel.language || 'ko-kr')}</language>
    <description>${cdata(channel.description || '')}</description>
    <itunes:author>${esc(channel.author || channel.title)}</itunes:author>
    <itunes:owner>
      <itunes:name>${esc(channel.author || channel.title)}</itunes:name>
      <itunes:email>${esc(channel.ownerEmail)}</itunes:email>
    </itunes:owner>
    <itunes:image href="${esc(channel.imageUrl || '')}"/>
    <itunes:category text="${esc(channel.category || 'Technology')}"/>
    <itunes:explicit>${channel.explicit ? 'true' : 'false'}</itunes:explicit>
    <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${esc(channel.feedUrl)}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;
}

export function formatDuration(seconds) {
  const n = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(n / 3600);
  const m = Math.floor((n % 3600) / 60);
  const s = n % 60;
  const pad = (x) => String(x).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
