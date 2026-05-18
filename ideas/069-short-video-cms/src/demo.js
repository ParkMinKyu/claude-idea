import { createHmac } from 'node:crypto';
import { verifyWebhook, mapAssetEvent } from './webhook.js';
import { retentionCurve, pickAdSlot } from './analytics.js';

const secret = 'demo_secret';
const body = JSON.stringify({
  type: 'video.asset.ready',
  data: { id: 'asset_1', playback_ids: [{ id: 'pb_1' }], duration: 18.4 },
});
const ts = Math.floor(Date.now() / 1000);
const sig = createHmac('sha256', secret).update(`${ts}.${body}`).digest('hex');
console.log('verify:', verifyWebhook({ rawBody: body, header: `t=${ts},v1=${sig}`, secret }));
console.log('mapped:', mapAssetEvent(JSON.parse(body)));

console.log('curve:', retentionCurve([
  { sessionId: 's1', progressRatio: 1 },
  { sessionId: 's2', progressRatio: 0.6 },
  { sessionId: 's3', progressRatio: 0.2 },
]));

console.log('ad slot:', pickAdSlot({ index: 4, frequency: 4, slots: ['slot_a', 'slot_b'] }));
