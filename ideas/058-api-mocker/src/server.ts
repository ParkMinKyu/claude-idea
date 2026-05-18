import Fastify from 'fastify';
import { createProject, getProject, matchEndpoint, renderTemplate, Endpoint } from './store';

export function buildServer() {
  const app = Fastify({ logger: false });

  app.post<{ Body: { slug: string; endpoints: Endpoint[] } }>('/projects', async (req, reply) => {
    const { slug, endpoints } = req.body;
    if (!slug || !Array.isArray(endpoints)) return reply.code(400).send({ error: 'bad input' });
    try {
      const p = createProject(slug, endpoints);
      return reply.code(201).send({ slug: p.slug, url: `/m/${p.slug}` });
    } catch (e) {
      return reply.code(409).send({ error: (e as Error).message });
    }
  });

  app.all('/m/:slug/*', async (req, reply) => {
    const slug = (req.params as { slug: string }).slug;
    const project = getProject(slug);
    if (!project) return reply.code(404).send({ error: 'project not found' });
    const path = '/' + (req.params as Record<string, string>)['*'];
    const ep = matchEndpoint(project, req.method as Endpoint['method'], path);
    if (!ep) return reply.code(404).send({ error: 'endpoint not found' });

    if (ep.errorRate && Math.random() < ep.errorRate) {
      return reply.code(500).send({ error: 'simulated failure' });
    }
    if (ep.delayMs) await new Promise((r) => setTimeout(r, ep.delayMs));
    return reply.code(ep.status).send(renderTemplate(ep.response));
  });

  return app;
}

if (require.main === module) {
  const app = buildServer();
  const port = Number(process.env.PORT ?? 3000);
  app.listen({ port, host: '0.0.0.0' }).then(() => {
    console.log(`api-mocker listening on :${port}`);
  });
}
