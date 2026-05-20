// Minimal HTTP rate-limit gateway using Node's built-in http server.
// Run: node src/server.ts  then  curl -i http://localhost:3000/
import { createServer } from 'node:http';
import { TokenBucketLimiter } from './lib/limiter';

const limiter = new TokenBucketLimiter({ capacity: 5, refillPerSec: 1 });

const server = createServer((req, res) => {
  const key = (req.socket.remoteAddress ?? 'anon') as string;
  const result = limiter.consume(key);
  res.setHeader('X-RateLimit-Limit', String(result.limit));
  res.setHeader('X-RateLimit-Remaining', String(result.remaining));
  if (!result.allowed) {
    res.setHeader('Retry-After', String(Math.ceil(result.retryAfterMs / 1000)));
    res.statusCode = 429;
    res.end('Too Many Requests\n');
    return;
  }
  res.statusCode = 200;
  res.end('ok\n');
});

const port = Number(process.env.PORT ?? 3000);
server.listen(port, () => process.stdout.write(`rate-limiter on :${port}\n`));
