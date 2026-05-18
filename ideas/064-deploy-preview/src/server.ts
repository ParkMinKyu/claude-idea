import Fastify from 'fastify';
import { verifySignature, planFromPayload, PullRequestPayload } from './webhook';

export function buildServer(secret: string, baseDomain: string) {
  const app = Fastify({ logger: false });

  app.post('/webhook', async (req, reply) => {
    const sig = req.headers['x-hub-signature-256'];
    const raw = JSON.stringify(req.body);
    if (!verifySignature(secret, Array.isArray(sig) ? sig[0] : sig, raw)) {
      return reply.code(401).send({ error: 'invalid signature' });
    }
    const event = req.headers['x-github-event'];
    if (event !== 'pull_request') return reply.send({ ignored: true });

    const plan = planFromPayload(req.body as PullRequestPayload, baseDomain);
    if (!plan) return reply.send({ ignored: true });

    // In production: enqueue plan to BullMQ for the deploy worker.
    return reply.send({ accepted: true, plan });
  });

  app.get('/health', async () => ({ ok: true }));
  return app;
}

if (require.main === module) {
  const app = buildServer(process.env.GH_SECRET ?? 'dev', process.env.BASE_DOMAIN ?? 'preview.local');
  const port = Number(process.env.PORT ?? 3000);
  app.listen({ port, host: '0.0.0.0' }).then(() => {
    console.log(`deploy-preview controller on :${port}`);
  });
}
