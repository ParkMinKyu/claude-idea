import { describe, it, expect, beforeEach } from 'vitest';
import { buildServer } from '../src/server';
import { clearAll, renderTemplate } from '../src/store';

beforeEach(() => clearAll());

describe('api-mocker server', () => {
  it('creates a project and serves a mock endpoint', async () => {
    const app = buildServer();
    const create = await app.inject({
      method: 'POST',
      url: '/projects',
      payload: {
        slug: 'demo',
        endpoints: [
          { method: 'GET', path: '/users/1', status: 200, response: { id: 1, name: 'Alice' } },
        ],
      },
    });
    expect(create.statusCode).toBe(201);

    const hit = await app.inject({ method: 'GET', url: '/m/demo/users/1' });
    expect(hit.statusCode).toBe(200);
    expect(hit.json()).toEqual({ id: 1, name: 'Alice' });
  });

  it('returns 404 for unknown project', async () => {
    const app = buildServer();
    const res = await app.inject({ method: 'GET', url: '/m/nope/anything' });
    expect(res.statusCode).toBe(404);
  });

  it('renders faker templates deterministically with seed', () => {
    const a = renderTemplate({ email: '{{faker.internet.email}}' }, 42);
    const b = renderTemplate({ email: '{{faker.internet.email}}' }, 42);
    expect(a).toEqual(b);
  });
});
