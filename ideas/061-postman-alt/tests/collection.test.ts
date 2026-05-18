import { describe, it, expect } from 'vitest';
import { substitute, applyVars, flattenRequests, toYaml, Collection } from '../src/collection';

describe('substitute', () => {
  it('replaces {{var}} tokens', () => {
    expect(substitute('hello {{name}}', { name: 'Alice' })).toBe('hello Alice');
  });

  it('leaves unknown vars in place', () => {
    expect(substitute('{{unknown}}', {})).toBe('{{unknown}}');
  });
});

describe('applyVars', () => {
  it('substitutes url, headers, and body', () => {
    const r = applyVars(
      {
        name: 't',
        method: 'POST',
        url: '{{host}}/x',
        headers: { Authorization: 'Bearer {{t}}' },
        body: '{"id":{{id}}}',
      },
      { host: 'https://api.test', t: 'tok', id: '7' }
    );
    expect(r.url).toBe('https://api.test/x');
    expect(r.headers?.Authorization).toBe('Bearer tok');
    expect(r.body).toBe('{"id":7}');
  });
});

describe('flattenRequests', () => {
  it('walks nested folders and prefixes names', () => {
    const c: Collection = {
      name: 'demo',
      root: {
        name: '',
        requests: [{ name: 'root-req', method: 'GET', url: '/' }],
        folders: [
          {
            name: 'auth',
            requests: [{ name: 'login', method: 'POST', url: '/login' }],
          },
        ],
      },
    };
    const flat = flattenRequests(c.root);
    expect(flat.map((r) => r.name)).toEqual(['root-req', 'auth / login']);
    expect(toYaml(c)).toContain('login');
  });
});
